# Windows transport for the immutable-object regression

The shallow-consumer regression executes the existing workflow's Bash body against synthetic local Git repositories. On a machine with native Windows Git and WSL's `bash.exe` first on PATH, passing the multiline body through `bash -c` corrupted its quotes and variables. Executing the same body as a file exposed a second mismatch: the native Windows clone's absolute file URL did not identify the same path for WSL's Git.

The fixture now writes the exact extracted body to a local script file, uses a relative local origin, and on Windows selects the Bash bundled with the already-installed Git, located from `git --exec-path`. It fails explicitly if that Bash is absent. Linux keeps its existing Bash. No package installation, permission change, production workflow change, mutable-reference fallback or test retry is introduced.

The successful test still requires an initially missing historical `old:src` object in a depth-one clone, the exact expected source tree after fetch, an unchanged current HEAD and a clean consumer worktree. The missing-object test now additionally requires the exact rejected hash in stderr; a quoting failure cannot satisfy that negative case accidentally.

Evidence retained separately:

- The original full Windows run had 1,140 passes, 14 failures and 189 conditional skips. Thirteen file-symlink privilege failures are outside this fix and remain unresolved.
- A focused original run retained six passes and one failure; fixture cleanup reported EPERM and masked the underlying error. A separate retained local reproduction showed the `bash -c` quote error directly.
- Executing the script file with WSL preserved the body but first failed the absolute file URL; a relative origin proved the body succeeds without changing the workflow. The WSL-focused run still exceeded the unchanged five-second test limit.
- Using the matching installed native Git/Bash passes all seven tests. The positive case took 2.9 seconds and the negative case 2.3 seconds in that observation. No timeout or assertion was loosened.

These are test-harness results, not rule execution or production deployment evidence. The source tree, schemas, generator, rule receipts and production workflow remain unchanged. Full Linux CI must still pass before merge.
