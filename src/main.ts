import * as core from '@actions/core'
import { Engine } from './engine'

export async function run(): Promise<void> {
  const engine = new Engine()

  await engine.process()
} 
