start:
	pnpm tauri dev

prod:
	pnpm tauri build

clean-build:
	cd ./src-tauri && cargo clean && cd -
	pnpm tauri build
