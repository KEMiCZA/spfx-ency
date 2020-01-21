## SPFx Ency

An end-to-end encryption SPFx chat webpart.

![alt text](/docs/EncyDemo.gif "Demo of Ency")

### Reasoning

I've seen in big organisations passwords/accounts/secrets being passed through e-mail or Microsoft Teams.
These accounts can be global admin accounts and even app registrations that have high level permissions.
This tool allows you to securely transact messages within your organisation.


### Limitations

* Currently only works among two parties
* Users need permissions to create/remove libraries
* SharePoint Online only

### How does it work

* Uses [ecc public key cryptography](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) for encryption with the [Stanford Javascript Crypto Library library](https://bitwiseshiftleft.github.io/sjcl/)
* Exchange of information happens with a SharePoint document library where new messages are trigger by the [SharePoint list subscription library](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/subscribe-to-list-notifications)

### Mentions

[Sven Bru](https://twitter.com/svenbru) for testing & feedback

### Building the code

```bash
git clone the repo
npm i
npm i -g gulp
gulp
```

This package produces the following:

* lib/* - intermediate-stage commonjs build artifacts
* dist/* - the bundled script, along with other resources
* deploy/* - all resources which should be uploaded to a CDN.

### Build options

gulp clean
gulp serve --nobrowser
gulp bundle --ship
gulp package-solution --ship


### Disclaimer

Use this tool at your own risk.