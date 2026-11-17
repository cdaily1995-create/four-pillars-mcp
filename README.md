# Four Pillars MCP

`four-pillars-mcp` is a small, read-only Model Context Protocol server for deterministic BaZi (八字) Four Pillars calculation.

It accepts an explicit local date, local time, IANA time zone, and geographic longitude. It does **not** geocode addresses, ask for gender, calculate decade luck, store birth data, or generate an interpretation.

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

## Run locally

```bash
pnpm install
pnpm build
pnpm start
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

## Search-friendly description

This project is a Four Pillars of Destiny calculator for BaZi birth-chart normalization. It provides reproducible year, month, day, and hour pillars from date, time, timezone, and longitude, including true solar time and solar-term handling. It is intended for calendrical and software workflows that need transparent calculation facts rather than automated fortune-telling claims.

## Privacy and scope

The server accepts coordinates and time-zone identifiers only. There is no address search, analytics, database, account, payment, or remote API requirement. Results are calculated locally by the process running the MCP server.

Traditional BaZi meanings are culturally interpretive and are not presented here as scientific proof, diagnosis, or guaranteed prediction.

## License

MIT
