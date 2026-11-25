# Security policy

## Reporting a vulnerability

Report vulnerabilities privately through a GitHub security advisory: https://github.com/buccanet/buccanet-web/security/advisories/new

Please do not open a public issue for a vulnerability. Include the affected commit, the browser, the steps to reproduce and the impact you observed.

A vulnerability in the protocol, the MLS client code or the SDK belongs to the core repository: https://github.com/buccanet/buccanet/security/advisories/new

A vulnerability in the relay belongs to the relay repository: https://github.com/buccanet/buccanet-relay/security/advisories/new

## Supported versions

Security fixes land on the `main` branch, which https://app.buccanet.com runs.

## Scope

Reports that matter most for the web app:

1. Script injection through message text, room names, room rules or member names.
2. Reading the device state or keys from IndexedDB through the app.
3. Leaking an invite link, a bearer token or message plaintext to another origin.
4. Accepting a message, a member or an admin change that the MLS group does not support.
