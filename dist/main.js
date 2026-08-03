"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    app.enableShutdownHooks();
    common_1.Logger.log('VetCare worker da khoi dong', 'Bootstrap');
}
void bootstrap();
//# sourceMappingURL=main.js.map