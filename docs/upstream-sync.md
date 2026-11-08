# Syncing with upstream

This fork carries a small adaptation of anothaDev's Vantage for QWRT
(QSDK, opkg, no `ucode-mod-rtnl`). Upstream keeps changing the two files
that hold most of it, so the arrangement below is what keeps a sync
cheap.

## Branches

- `main` — the upstream release, nothing else. Fast-forward only.
- `qwrt` — the adaptation, rebased onto every upstream release.

## Procedure

```sh
git fetch upstream --tags

# what upstream changed in the files we touch: empty output, no conflicts
git log --oneline v1.0.15..v1.0.16 -- \
	luci-app-vantage/root/usr/share/rpcd/ucode/luci.vantage \
	luci-app-vantage/htdocs/luci-static/resources/view/vantage/overview.js \
	luci-theme-vantage/ucode/template/themes/vantage/header.ut \
	luci-theme-vantage/ucode/template/themes/vantage/footer.ut \
	luci-app-vantage/root/usr/share/rpcd/acl.d/luci-app-vantage.json

git switch qwrt
git rebase --onto v1.0.16 v1.0.15
git range-diff v1.0.15..qwrt@{1} v1.0.16..qwrt   # review what came back
```

Then the usual checks, and only then a release:

```sh
node --test tests/
dev/i18n/update.sh --check
node security-tests/check_dom_sinks.js
node security-tests/test_templates.js
node security-tests/test_acl_policy.js
node security-tests/check_private_addresses.js
```

`git config rerere.enabled true` (and `rerere.autoupdate`) makes the
second and later resolutions of the same hunk automatic.

## What the patch touches

| Path | Coupling |
|---|---|
| `qwrt.css`, `qwrt-openclash.css`, `subscribe-autosize.js` | new files; upstream cannot conflict with them |
| `luci.vantage` | `wireless_from_config()`, `wired()`, the method table — upstream edits this file nearly every release |
| `view/vantage/overview.js` | two helpers and one call site in `fetch()` |
| `header.ut`, `footer.ut` | a stylesheet, a script, one conditional block |
| `tests/plugin.test.js`, `security-tests/` | follow the plugin; resolve after it |
| `po/` | generated |

## Catalogues: regenerate, never resolve by hand

`po/templates/*.pot` and the `.po` files are produced by
`dev/i18n/update.sh`; a conflict there is only a moved `#:` reference.
During a rebase, take upstream's version and regenerate:

```sh
git checkout --ours -- luci-app-vantage/po luci-theme-vantage/po
dev/i18n/update.sh
git add luci-app-vantage/po luci-theme-vantage/po
git rebase --continue
```

This removes about three quarters of the textual conflicts.

## When upstream makes a patch unnecessary

If upstream grows the same behaviour, drop the commit rather than
keeping both:

- naming a config-only VAP after its section when the kernel has it;
- reading the bridge forwarding database from `brforward`;
- filling `system.info`'s missing `root`/`tmp` from `luci.getMountPoints`.

`git rebase --skip` while the commit is in flight, or `git rebase -i`
afterwards.

## What stays out of the fork

- `.github/workflows/ci.yml` is upstream's, untouched. Every QWRT job
  lives in `.github/workflows/qwrt.yml`.
- `PKG_RELEASE` changes only when a release is cut, not with each commit.
