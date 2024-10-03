start:
	pnpm tauri dev

prod:
	cd ./src-tauri && cargo clean && cd -
	pnpm tauri build
