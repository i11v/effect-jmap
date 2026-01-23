#!/usr/bin/env tsx
/**
 * Spec Coverage Reporter
 *
 * Reports on JMAP method implementation completeness.
 *
 * Usage:
 *   pnpm coverage:spec
 *   pnpm coverage:spec --json
 *   pnpm coverage:spec --by-type
 */

import {
  JMAPCapabilities,
  getCompleteness,
  getCompletenessByType,
  getImplementedMethods,
  getUnimplementedMethods
} from '../tests/config/capabilities.js'

interface CliArgs {
  json: boolean
  byType: boolean
  help: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  return {
    json: args.includes('--json'),
    byType: args.includes('--by-type'),
    help: args.includes('--help') || args.includes('-h')
  }
}

function printHelp() {
  console.log(`
Spec Coverage Reporter

Reports on JMAP method implementation completeness.

Usage:
  pnpm coverage:spec [options]

Options:
  --json      Output as JSON
  --by-type   Group coverage by object type
  --help, -h  Show this help message

Examples:
  pnpm coverage:spec           # Show coverage table
  pnpm coverage:spec --by-type # Show coverage grouped by type
  pnpm coverage:spec --json    # Output as JSON for CI/scripts
`)
}

function printTable(headers: string[], rows: string[][], columnWidths?: number[]) {
  const widths = columnWidths || headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] || '').length))
  )

  const separator = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+'
  const formatRow = (row: string[]) =>
    '|' + row.map((cell, i) => ` ${cell.padEnd(widths[i])} `).join('|') + '|'

  console.log(separator)
  console.log(formatRow(headers))
  console.log(separator)
  for (const row of rows) {
    console.log(formatRow(row))
  }
  console.log(separator)
}

function printProgress(percentage: number, width: number = 30): string {
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

function printSummary() {
  const completeness = getCompleteness()
  const implemented = getImplementedMethods()
  const unimplemented = getUnimplementedMethods()

  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║              JMAP RFC 8621 Implementation Coverage          ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  ${printProgress(completeness.percentage)}  ${completeness.percentage.toFixed(1)}%  ║`)
  console.log(`║  ${completeness.implemented}/${completeness.total} methods implemented                           ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Print detailed table
  const rows = Object.entries(JMAPCapabilities).map(([method, impl]) => [
    method,
    impl ? '✓ Implemented' : '○ Pending'
  ])

  printTable(['JMAP Method', 'Status'], rows, [30, 15])

  console.log('\n')
}

function printByType() {
  const byType = getCompletenessByType()

  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         JMAP Implementation Coverage by Object Type         ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  for (const [type, data] of Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`\n  ${type}`)
    console.log(`  ${printProgress(data.percentage, 25)} ${data.percentage.toFixed(1)}% (${data.implemented}/${data.total})`)
    console.log('')

    for (const method of data.methods) {
      const status = method.implemented ? '  ✓' : '  ○'
      const name = method.name.split('/')[1]
      console.log(`    ${status} ${name}`)
    }
  }

  console.log('\n')

  // Overall summary
  const completeness = getCompleteness()
  console.log('─'.repeat(60))
  console.log(`  Overall: ${completeness.implemented}/${completeness.total} methods (${completeness.percentage.toFixed(1)}%)`)
  console.log('')
}

function printJson() {
  const result = {
    overall: getCompleteness(),
    byType: getCompletenessByType(),
    implemented: getImplementedMethods(),
    unimplemented: getUnimplementedMethods(),
    all: JMAPCapabilities
  }

  console.log(JSON.stringify(result, null, 2))
}

function main() {
  const args = parseArgs()

  if (args.help) {
    printHelp()
    return
  }

  if (args.json) {
    printJson()
    return
  }

  if (args.byType) {
    printByType()
    return
  }

  printSummary()
}

main()
