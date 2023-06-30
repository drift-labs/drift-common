"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
// generate.ts
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var chalk_1 = __importDefault(require("chalk"));
var dotenv_1 = __importDefault(require("dotenv"));
var figma_api_exporter_1 = __importDefault(require("figma-api-exporter"));
var svgr_config_1 = __importDefault(require("../svgr.config"));
var utils_1 = require("./utils");
var svgr = require('@svgr/core')["default"];
var ICONS_DIRECTORY_PATH = path_1["default"].resolve(__dirname, './icons/components');
var SVG_DIRECTORY_PATH = path_1["default"].resolve(__dirname, './icons/svgs');
var INDEX_DIRECTORY_PATH = path_1["default"].resolve(__dirname, './icons');
// Load environment variables
dotenv_1["default"].config();
// 1. Retrieve Figma Access Token, File ID and Canvas from .env file
var FIGMA_API_TOKEN = process.env.FIGMA_API_TOKEN;
var FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
var FIGMA_CANVAS = process.env.FIGMA_CANVAS;
if (!FIGMA_API_TOKEN ||
    !FIGMA_FILE_ID ||
    !FIGMA_CANVAS ||
    FIGMA_API_TOKEN === 'NOT SET') {
    console.error('Environment Variables not set.');
    process.exit(1);
}
// 2. Fetch icons metadata from Figma
console.log(chalk_1["default"].magentaBright('-> Fetching icons metadata'));
var exporter = (0, figma_api_exporter_1["default"])(FIGMA_API_TOKEN);
exporter
    .getSvgs({
    fileId: FIGMA_FILE_ID,
    canvas: FIGMA_CANVAS
})
    .then(function (svgsData) { return __awaiter(void 0, void 0, void 0, function () {
    var downloadedSVGsData, _i, downloadedSVGsData_1, svg, manuallyAddedSvgs, svgFiles, allSVGs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // 3. Download SVG files from Figma
                console.log(chalk_1["default"].blueBright('-> Downloading SVG code'));
                return [4 /*yield*/, (0, utils_1.downloadSVGsData)(svgsData.svgs)];
            case 1:
                downloadedSVGsData = _a.sent();
                // Filter out any icons that aren't 16px to remove duplicates
                downloadedSVGsData = downloadedSVGsData.filter(function (svg) {
                    return svg.name.includes('16px');
                });
                // Replace annoying stuff in icon names
                for (_i = 0, downloadedSVGsData_1 = downloadedSVGsData; _i < downloadedSVGsData_1.length; _i++) {
                    svg = downloadedSVGsData_1[_i];
                    svg.name = svg.name
                        .replace('Icon', '')
                        .replace('16px', '')
                        .replace('Size', '')
                        .replace(/ /g, '');
                }
                // 4. Read manually added SVGs data
                console.log(chalk_1["default"].blueBright('-> Reading manually added SVGs'));
                manuallyAddedSvgs = [];
                if (fs_extra_1["default"].existsSync(SVG_DIRECTORY_PATH)) {
                    svgFiles = fs_extra_1["default"]
                        .readdirSync(SVG_DIRECTORY_PATH)
                        // Filter out hidden files (e.g. .DS_STORE)
                        .filter(function (item) { return !/(^|\/)\.[^/.]/g.test(item); });
                    svgFiles.forEach(function (fileName) {
                        var svgData = fs_extra_1["default"].readFileSync(path_1["default"].resolve(SVG_DIRECTORY_PATH, fileName), 'utf-8');
                        manuallyAddedSvgs.push({
                            data: svgData,
                            name: (0, utils_1.toPascalCase)(fileName.replace(/svg/i, ''))
                        });
                    });
                }
                else {
                    console.log(chalk_1["default"].blueBright('-> No manually added SVGs found'));
                }
                allSVGs = __spreadArray(__spreadArray([], downloadedSVGsData, true), manuallyAddedSvgs, true);
                // 5. Convert SVG to React Components
                console.log(chalk_1["default"].cyanBright('-> Converting to React components'));
                allSVGs.forEach(function (svg) {
                    var svgCode = svg.data;
                    var componentName = (0, utils_1.toPascalCase)(svg.name);
                    var componentFileName = "".concat(componentName, ".tsx");
                    // Converts SVG code into React code using SVGR library
                    var componentCode = svgr.sync(svgCode, svgr_config_1["default"], { componentName: componentName });
                    // 6. Write generated component to file system
                    fs_extra_1["default"].ensureDirSync(ICONS_DIRECTORY_PATH);
                    fs_extra_1["default"].outputFileSync(path_1["default"].resolve(ICONS_DIRECTORY_PATH, componentFileName), componentCode);
                });
                // 7. Generate index.ts
                console.log(chalk_1["default"].yellowBright('-> Generating index file'));
                (0, utils_1.createIndex)({
                    componentsDirectoryPath: ICONS_DIRECTORY_PATH,
                    indexDirectoryPath: INDEX_DIRECTORY_PATH,
                    indexFileName: 'index.ts'
                });
                console.log(chalk_1["default"].greenBright('-> All done! ✅'));
                return [2 /*return*/];
        }
    });
}); })["catch"](function (err) {
    console.error(err);
    process.exit(1);
});
