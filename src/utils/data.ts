import type { SqlValue } from "sql.js";
import type { CallerPlugin } from "./basic";
import type { GWFVisDefaultPluginSharedStates } from "./state";

import { ColorSchemeDefinition } from "./color";

export type Variable = {
  id: number;
  name: string;
  unit?: string;
  description?: string;
};

export type Dimension = {
  id: number;
  name: string;
  size: number;
  description?: string;
  value_labels?: string[];
};

export type VariableWithDimensions = Variable & {
  dimensions?: Dimension[];
};

export type Location = {
  id: number;
  geometry: GeoJSON.Geometry;
  metadata: unknown;
};

export type Value = {
  location: Location;
  value: number;
  variable: Variable;
  dimensionIdAndValueDict: { [dimensionId: number]: number | undefined };
};

export type DataFrom = {
  dataSource?: string;
  variableName?: string;
  dimensionValueDict?: { [dimension: string]: number };
};

export function obtainCurrentDataSource(
  dataFrom?: DataFrom,
  sharedStates?: GWFVisDefaultPluginSharedStates
) {
  return (
    dataFrom?.dataSource ?? sharedStates?.["gwf-default.currentDataSource"]
  );
}

export async function obtainCurrentVariable(
  dataSource?: string,
  dataFrom?: DataFrom,
  sharedStates?: GWFVisDefaultPluginSharedStates,
  callerPlugin?: CallerPlugin | undefined
) {
  const currentDataSource =
    dataSource ?? obtainCurrentDataSource(dataFrom, sharedStates);
  let variable = await findVariableByName(
    currentDataSource,
    dataFrom?.variableName,
    callerPlugin
  );
  const variableId =
    variable?.id ?? sharedStates?.["gwf-default.currentVariableId"];
  if (variableId == null) {
    return;
  }
  if (!variable) {
    variable = await findVariableById(
      currentDataSource,
      variableId,
      callerPlugin
    );
  }
  return variable;
}

export async function obtainCurrentColorScheme(
  dataSource?: string,
  variable?: Variable,
  dataFrom?: DataFrom,
  colorScheme?: {
    [dataSource: string]: { [variable: string]: ColorSchemeDefinition };
  },
  sharedStates?: GWFVisDefaultPluginSharedStates,
  callerPlugin?: CallerPlugin | undefined
) {
  const currentDataSource =
    dataSource ?? obtainCurrentDataSource(dataFrom, sharedStates);
  const currentVariable =
    variable ??
    (await obtainCurrentVariable(
      dataSource,
      dataFrom,
      sharedStates,
      callerPlugin
    ));
  if (!currentDataSource || !currentVariable) {
    return;
  }
  return (
    colorScheme?.[currentDataSource]?.[currentVariable.name] ??
    colorScheme?.[currentDataSource]?.[""] ??
    colorScheme?.[""]
  );
}

export async function findVariableByName(
  dataSource: string | undefined,
  variableName: string | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || !variableName) {
    return;
  }
  const availableVariables = await obtainAvailableVariables(
    dataSource,
    callerPlugin
  );
  return availableVariables?.find((variable) => variable.name === variableName);
}

export async function findVariableById(
  dataSource: string | undefined,
  variableId: number | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || variableId == null) {
    return;
  }
  const availableVariables = await obtainAvailableVariables(
    dataSource,
    callerPlugin
  );
  return availableVariables?.find((variable) => variable.id === variableId);
}

export async function obtainMaxAndMinForVariable(
  dataSource: string | undefined,
  variableId: number | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || variableId == null) {
    return;
  }
  const sql = `SELECT MAX(value), MIN(value) FROM value where variable = ${variableId}`;
  const sqlResult = await callerPlugin?.queryDataDelegate?.(dataSource, sql);
  const [max, min] = sqlResult?.values?.[0] ?? [];
  return { max: +(max ?? Number.NaN), min: +(min ?? Number.NaN) };
}

export async function obtainAvailableVariables(
  dataSource: string | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || !callerPlugin) {
    return;
  }
  const variables = obtainAvailableVariablesFromCache(dataSource, callerPlugin);
  if (variables) {
    return variables;
  }
  await cacheAvailableVariablesIfNotCached(dataSource, callerPlugin);
  const sharedStates = callerPlugin.sharedStates as
    | GWFVisDefaultPluginSharedStates
    | undefined;
  return sharedStates?.["gwf-default.cache.availableVariablesDict"]?.[
    dataSource
  ];
}

export async function obtainAvailableLocations(
  dataSource: string | undefined,
  callerPlugin: CallerPlugin | undefined
) {
  if (!dataSource || !callerPlugin) {
    return;
  }
  return queryLocations(dataSource, callerPlugin);
}

function obtainAvailableVariablesFromCache(
  dataSource: string,
  callerPlugin: CallerPlugin
) {
  const sharedStates = callerPlugin.sharedStates as
    | GWFVisDefaultPluginSharedStates
    | undefined;
  const variables =
    sharedStates?.["gwf-default.cache.availableVariablesDict"]?.[dataSource];
  return variables;
}

async function cacheAvailableVariablesIfNotCached(
  dataSource: string,
  callerPlugin: CallerPlugin
) {
  if (obtainAvailableVariablesFromCache(dataSource, callerPlugin)) {
    return;
  }
  const sharedStates = callerPlugin.sharedStates as
    | GWFVisDefaultPluginSharedStates
    | undefined;
  let availablVariablesDict =
    sharedStates?.["gwf-default.cache.availableVariablesDict"];
  if (!availablVariablesDict) {
    availablVariablesDict = callerPlugin.sharedStates[
      "gwf-default.cache.availableVariablesDict"
    ] = {};
  }
  const variables = await queryVariables(dataSource, callerPlugin);
  availablVariablesDict[dataSource] = variables;
  return variables;
}

async function queryVariables(dataSource: string, callerPlugin: CallerPlugin) {
  let sql = `SELECT id, name, unit, description FROM variable`;
  let sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  const variables = sqlResult?.values?.map(
    (d) =>
      Object.fromEntries(
        d?.map((value, columnIndex) => [
          sqlResult?.columns?.[columnIndex],
          value,
        ])
      ) as Variable
  );
  const dimensions = await queryDimensions(dataSource, callerPlugin);
  await fillCorrespondingDimensionsIntoVariables(
    dataSource,
    variables,
    dimensions,
    callerPlugin
  );
  return variables;
}

async function queryDimensions(dataSource: string, callerPlugin: CallerPlugin) {
  const sql = `SELECT id, name, size, description, value_labels FROM dimension`;
  const sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  const dimensions = sqlResult?.values?.map(
    (d) =>
      Object.fromEntries(
        d?.map((value, columnIndex) => {
          const columnName = sqlResult?.columns?.[columnIndex];
          if (columnName === "value_labels") {
            value = value ? JSON.parse(value as string) : undefined;
          }
          return [columnName, value as SqlValue | string[]];
        })
      ) as Dimension
  );
  return dimensions;
}

async function queryLocations(dataSource: string, callerPlugin: CallerPlugin) {
  const sql = `SELECT id, geometry, metadata FROM location`;
  const sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  const locations = sqlResult?.values?.map(
    (d) =>
      Object.fromEntries(
        d?.map((value, columnIndex) => {
          const columnName = sqlResult?.columns?.[columnIndex];
          if (columnName === "geometry" || columnName === "metadata") {
            value = value ? JSON.parse(value as string) : undefined;
          }
          return [columnName, value as any];
        })
      ) as Location
  );
  return locations;
}

async function fillCorrespondingDimensionsIntoVariables(
  dataSource: string,
  variables: Variable[] | undefined,
  dimensions: Dimension[] | undefined,
  callerPlugin: CallerPlugin
) {
  const sql = `SELECT variable, dimension FROM variable_dimension`;
  const sqlResult = await callerPlugin.queryDataDelegate?.(dataSource, sql);
  sqlResult?.values?.forEach(([variableId, dimensionId]) => {
    const variable = variables?.find((variable) => variable.id === variableId);
    const dimension = dimensions?.find(
      (dimension) => dimension.id === dimensionId
    );
    if (!variable) {
      return;
    }
    let variableDimensions = (variable as VariableWithDimensions).dimensions;
    if (!variableDimensions) {
      variableDimensions = (variable as VariableWithDimensions).dimensions = [];
    }
    dimension && variableDimensions.push(dimension);
  });
}
