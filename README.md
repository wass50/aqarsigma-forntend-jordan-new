# MyAngular17App

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build (local / CI)

- Build using the default environment (src/environments/environment.ts):
  ```
  npm run build
  ```

- Build QA configuration (uses file replacements in angular.json -> `qa`):
  ```
  npm run build -- --configuration=qa
  ```
  (or, if you added a script) `npm run build:qa`

- Build Production configuration (uses `environment.prod.ts`):
  ```
  npm run build -- --configuration=production
  ```
  (or) `npm run build:prod`

- Optional: set custom output path:
  ```
  npm run build -- --configuration=production --output-path=dist/aqar-sigma-angular-jordan
  ```

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Production build & environments

1. Environment files
- Dev: `src/environments/environment.ts` -> export `apiBaseUrl: 'http://localhost:8080'`
- Prod: `src/environments/environment.prod.ts` -> export `apiBaseUrl: 'https://api.yourdomain.com'`

2. Build for production
```bash
ng build --configuration production
# or
ng build --prod
```

3. Serve production build locally
Replace `<outputPath>` with the output folder from `angular.json` (usually `dist/<project-name>`):
```bash
npx http-server ./dist/<outputPath> -p 8080
# or
npx serve ./dist/<outputPath> -l 8080
# or (python)
cd ./dist/<outputPath> && python3 -m http.server 8080
```

4. Run dev server using prod environment (quick preview)
```bash
ng serve --configuration production
```

5. Useful npm scripts (add to `package.json` -> `scripts`)
```json
"build:prod": "ng build --configuration production",
"serve:prod": "npx http-server ./dist/<outputPath> -p 8080"
```

6. Verify
- Console-log `environment.apiBaseUrl` in app to confirm the correct environment file is used after build.

