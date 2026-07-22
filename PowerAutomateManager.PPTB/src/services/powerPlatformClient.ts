import { getPowerPlatformApi, type PpNamespace, type PowerPlatformResponse } from '../models/hostApi';

export async function get(ns: PpNamespace, path: string): Promise<PowerPlatformResponse> {
  return getPowerPlatformApi()[ns].Get(path);
}

export async function post(
  ns: PpNamespace,
  path: string,
  body: unknown,
): Promise<PowerPlatformResponse> {
  return getPowerPlatformApi()[ns].Post(path, body);
}
