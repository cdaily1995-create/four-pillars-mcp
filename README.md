# Four Pillars MCP Server

[![MCP server](https://img.shields.io/badge/MCP-server-5f5bd6)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An [MCP](https://modelcontextprotocol.io/) server for deterministic **BaZi (八字) Four Pillars** calculation from a local date, time, IANA timezone, and longitude.

Built for transparent calendrical and software workflows that need year, month, day, and hour pillars without address geocoding, gender-dependent luck cycles, stored birth data, or automated interpretation.

## Why this is useful

- **Coordinates in, no hidden location lookup.** Callers pass the timezone and longitude they already trust.
- **True solar time included.** Day and hour calculations use local apparent solar time; the response exposes the correction details.
- **Solar-term aware.** Year and month use astronomical solar-term boundaries.
- **Facts before interpretation.** The tool returns versioned chart facts, not guaranteed predictions.

## Tool

### `calculate_four_pillars`

Input:

```json
{
  "date": "1990-05-20",
  "time": "14:30",
  "timezone": "Asia/Shanghai",
  "longitude": 104.0668,
  "latitude": 30.5728
}
```

The calculation uses:

- local apparent true solar time for day and hour calculations;
- astronomical solar-term boundaries for year and month;
- 23:00 Zi-hour as the next-day boundary;
- explicit engine and rules versions in every result.

The result contains the year, month, day, and hour pillars, stem and branch elements, yin-yang labels, Day Master, time correction details, nearby solar-term information, warnings, and provenance.

## Quick start

```bash
git clone https://github.com/cdaily1995-create/four-pillars-mcp.git
cd four-pillars-mcp
pnpm install
pnpm build
node dist/server.js
```

After the package is published, the npm-based shortcut will be:

```bash
npx -y bazi-four-pillars-mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "four-pillars": {
      "command": "node",
      "args": ["/absolute/path/to/four-pillars-mcp/dist/server.js"]
    }
  }
}
```

## Example

```text
calculate_four_pillars {
  "date": "2005-12-23",
  "time": "08:37",
  "timezone": "Asia/Shanghai",
  "longitude": 121.4737,
  "latitude": 31.2304
}
```

The response contains the four pillar names, stem and branch elements, yin-yang labels, Day Master, true-solar correction details, nearby solar-term information, warnings, and engine/rules versions.

## Input contract

| Field       | Required | Description                                                       |
| ----------- | -------- | ----------------------------------------------------------------- |
| `date`      | yes      | Local civil date in `YYYY-MM-DD`.                                 |
| `time`      | yes      | Local civil time in `HH:mm`.                                      |
| `timezone`  | yes      | IANA identifier such as `Asia/Shanghai` or `America/Los_Angeles`. |
| `longitude` | yes      | Decimal degrees, east positive, from `-180` to `180`.             |
| `latitude`  | no       | Decimal degrees, from `-90` to `90`; retained for traceability.   |

## Links

- [BaZi Calculator](https://bazi-calculator.co/) — the public calculator project for Four Pillars workflows.
- [Free chart entry](https://bazi-calculator.co/bazi) — the public chart route.
- [Four Pillars of Destiny guide](https://bazi-calculator.co/four-pillars-of-destiny) — terminology and context.
- [What is a BaZi chart?](https://bazi-calculator.co/what-is-a-bazi-chart) — beginner-friendly explanation.
- [True Solar Time MCP Server](https://github.com/cdaily1995-create/true-solar-time-mcp) — the companion standalone time-normalization tool.
- [MCP specification](https://modelcontextprotocol.io/) — protocol documentation.
- [MCP TypeScript server SDK](https://www.npmjs.com/package/@modelcontextprotocol/server) — server SDK used by this project.
- [tyme4ts on npm](https://www.npmjs.com/package/tyme4ts) — calendar and solar-term dependency.
- Planned npm package name: `bazi-four-pillars-mcp` (publication requires an authenticated npm account).
- [Full link inventory](LINKS.md) and [method references](REFERENCES.md).

## Search-friendly description

This project is a Four Pillars of Destiny calculator for BaZi birth-chart normalization. It provides reproducible year, month, day, and hour pillars from date, time, timezone, and longitude, including true solar time and solar-term handling. It is intended for calendrical and software workflows that need transparent calculation facts rather than automated fortune-telling claims.

## Privacy and scope

The server accepts coordinates and time-zone identifiers only. There is no address search, analytics, database, account, payment, or remote API requirement. Results are calculated locally by the process running the MCP server.

Traditional BaZi meanings are culturally interpretive and are not presented here as scientific proof, diagnosis, or guaranteed prediction.

## License

MIT
