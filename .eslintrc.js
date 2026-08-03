/**
 * Worker la mot TIEN TRINH RIENG, khong phai mot thu muc con cua backend.
 *
 * Ranh gioi duy nhat duoc phep giua hai tien trinh:
 *   - `@vetcare/contracts` : ten hang doi + payload job (trinh bien dich kiem tra duoc)
 *   - PostgreSQL           : truy van bang SQL tho co kieu ro rang
 *
 * Cam import nguoc vao backend. Neu cho phep, worker se keo theo 26 entity cua backend
 * va hai tien trinh buoc phai deploy cung nhau moi khi doi mot entity bat ky - dung thu
 * ma viec tach tien trinh (rang buoc R5 trong tai lieu kien truc) nham tranh.
 * Xem muc 7 trong docs/00-SAI-LECH-SO-VOI-TAI-LIEU-KIEN-TRUC.md.
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '**/veterinary-clinic-backend/**',
              '**/apps/veterinary-clinic-backend',
              '@vetcare/api',
              '@vetcare/api/**',
            ],
            message:
              'Worker khong duoc import tu backend. Hai tien trinh chi duoc chia se qua ' +
              '@vetcare/contracts (ten hang doi, payload job) va qua chinh CSDL.',
          },
        ],
      },
    ],
  },
};
