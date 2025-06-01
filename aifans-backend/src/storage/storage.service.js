"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
var common_1 = require("@nestjs/common");
var fs = require("fs");
var path = require("path");
var OSS = require("ali-oss");
var uuid_1 = require("uuid");
var StorageService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var StorageService = _classThis = /** @class */ (function () {
        function StorageService_1(configService, prisma, storageConfig) {
            this.configService = configService;
            this.prisma = prisma;
            this.storageConfig = storageConfig;
            this.logger = new common_1.Logger(StorageService.name);
            // 初始化OSS客户端（如果配置了OSS）
            this.initOssClient();
        }
        // 初始化OSS客户端
        StorageService_1.prototype.initOssClient = function () {
            if (this.storageConfig.isOssEnabled) {
                try {
                    this.ossClient = new OSS({
                        region: this.storageConfig.ossRegion,
                        accessKeyId: this.storageConfig.ossAccessKeyId,
                        accessKeySecret: this.storageConfig.ossAccessKeySecret,
                        bucket: this.storageConfig.ossBucket,
                    });
                    this.logger.log('OSS客户端初始化成功');
                }
                catch (error) {
                    this.logger.error('OSS客户端初始化失败', error);
                }
            }
        };
        // 上传文件
        StorageService_1.prototype.uploadFile = function (file_1) {
            return __awaiter(this, arguments, void 0, function (file, folder) {
                var uniqueFileName, key;
                if (folder === void 0) { folder = 'general'; }
                return __generator(this, function (_a) {
                    uniqueFileName = "".concat(Date.now(), "-").concat((0, uuid_1.v4)()).concat(path.extname(file.originalname));
                    key = "".concat(folder, "/").concat(uniqueFileName);
                    // 判断是否使用OSS
                    if (this.storageConfig.isOssEnabled && this.ossClient) {
                        return [2 /*return*/, this.uploadToOSS(file.buffer, key)];
                    }
                    else {
                        return [2 /*return*/, this.uploadToLocal(file.buffer, key)];
                    }
                    return [2 /*return*/];
                });
            });
        };
        // 上传到本地存储
        StorageService_1.prototype.uploadToLocal = function (buffer, key) {
            return __awaiter(this, void 0, void 0, function () {
                var uploadDir, filePath, dirPath, url;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            uploadDir = path.join(process.cwd(), 'uploads');
                            filePath = path.join(uploadDir, key);
                            dirPath = path.dirname(filePath);
                            // 确保目录存在
                            if (!fs.existsSync(dirPath)) {
                                fs.mkdirSync(dirPath, { recursive: true });
                            }
                            // 写入文件
                            return [4 /*yield*/, fs.promises.writeFile(filePath, buffer)];
                        case 1:
                            // 写入文件
                            _a.sent();
                            url = "/uploads/".concat(key);
                            return [2 /*return*/, { url: url, key: key }];
                    }
                });
            });
        };
        // 上传到OSS
        StorageService_1.prototype.uploadToOSS = function (buffer, key) {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.ossClient.put(key, buffer)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    url: result.url || "".concat(this.storageConfig.ossCdnDomain, "/").concat(key),
                                    key: key,
                                }];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error("\u4E0A\u4F20\u5230OSS\u5931\u8D25: ".concat(error_1.message), error_1.stack);
                            throw new Error("\u4E0A\u4F20\u5230OSS\u5931\u8D25: ".concat(error_1.message));
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // 删除文件
        StorageService_1.prototype.deleteFile = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var filePath, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            if (!(this.storageConfig.isOssEnabled && this.ossClient)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.ossClient.delete(key)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            filePath = path.join(process.cwd(), 'uploads', key);
                            if (!fs.existsSync(filePath)) return [3 /*break*/, 4];
                            return [4 /*yield*/, fs.promises.unlink(filePath)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/, true];
                        case 5:
                            error_2 = _a.sent();
                            this.logger.error("\u5220\u9664\u6587\u4EF6\u5931\u8D25: ".concat(error_2.message), error_2.stack);
                            return [2 /*return*/, false];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        // 获取文件URL
        StorageService_1.prototype.getFileUrl = function (key) {
            if (this.storageConfig.isOssEnabled) {
                return "".concat(this.storageConfig.ossCdnDomain, "/").concat(key);
            }
            else {
                return "/uploads/".concat(key);
            }
        };
        // 迁移到OSS
        StorageService_1.prototype.migrateToOSS = function () {
            return __awaiter(this, void 0, void 0, function () {
                var result, posts, _i, posts_1, post, localKey, localPath, buffer, url, localKey, localPath, buffer, url, error_3, users, _a, users_1, user, localKey, localPath, buffer, url, error_4, notes, _b, notes_1, note, localKey, localPath, buffer, url, error_5, error_6;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!this.storageConfig.isOssEnabled || !this.ossClient) {
                                throw new Error('OSS未配置，无法迁移');
                            }
                            result = {
                                total: 0,
                                migrated: 0,
                                failed: 0,
                                details: [],
                            };
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 36, , 37]);
                            return [4 /*yield*/, this.prisma.post.findMany({
                                    select: {
                                        id: true,
                                        fileUrl: true,
                                        thumbnailUrl: true,
                                    },
                                })];
                        case 2:
                            posts = _c.sent();
                            result.total += posts.length;
                            _i = 0, posts_1 = posts;
                            _c.label = 3;
                        case 3:
                            if (!(_i < posts_1.length)) return [3 /*break*/, 15];
                            post = posts_1[_i];
                            _c.label = 4;
                        case 4:
                            _c.trys.push([4, 13, , 14]);
                            if (!(post.fileUrl && post.fileUrl.startsWith('/uploads/'))) return [3 /*break*/, 8];
                            localKey = post.fileUrl.replace('/uploads/', '');
                            localPath = path.join(process.cwd(), 'uploads', localKey);
                            if (!fs.existsSync(localPath)) return [3 /*break*/, 8];
                            return [4 /*yield*/, fs.promises.readFile(localPath)];
                        case 5:
                            buffer = _c.sent();
                            return [4 /*yield*/, this.uploadToOSS(buffer, localKey)];
                        case 6:
                            url = (_c.sent()).url;
                            return [4 /*yield*/, this.prisma.post.update({
                                    where: { id: post.id },
                                    data: { fileUrl: url },
                                })];
                        case 7:
                            _c.sent();
                            _c.label = 8;
                        case 8:
                            if (!(post.thumbnailUrl && post.thumbnailUrl.startsWith('/uploads/'))) return [3 /*break*/, 12];
                            localKey = post.thumbnailUrl.replace('/uploads/', '');
                            localPath = path.join(process.cwd(), 'uploads', localKey);
                            if (!fs.existsSync(localPath)) return [3 /*break*/, 12];
                            return [4 /*yield*/, fs.promises.readFile(localPath)];
                        case 9:
                            buffer = _c.sent();
                            return [4 /*yield*/, this.uploadToOSS(buffer, localKey)];
                        case 10:
                            url = (_c.sent()).url;
                            return [4 /*yield*/, this.prisma.post.update({
                                    where: { id: post.id },
                                    data: { thumbnailUrl: url },
                                })];
                        case 11:
                            _c.sent();
                            _c.label = 12;
                        case 12:
                            result.migrated++;
                            result.details.push({
                                type: 'post',
                                id: post.id,
                                status: 'success',
                            });
                            return [3 /*break*/, 14];
                        case 13:
                            error_3 = _c.sent();
                            result.failed++;
                            result.details.push({
                                type: 'post',
                                id: post.id,
                                status: 'failed',
                                error: error_3.message,
                            });
                            return [3 /*break*/, 14];
                        case 14:
                            _i++;
                            return [3 /*break*/, 3];
                        case 15: return [4 /*yield*/, this.prisma.user.findMany({
                                where: {
                                    avatarUrl: {
                                        startsWith: '/uploads/',
                                    },
                                },
                                select: {
                                    id: true,
                                    avatarUrl: true,
                                },
                            })];
                        case 16:
                            users = _c.sent();
                            result.total += users.length;
                            _a = 0, users_1 = users;
                            _c.label = 17;
                        case 17:
                            if (!(_a < users_1.length)) return [3 /*break*/, 25];
                            user = users_1[_a];
                            _c.label = 18;
                        case 18:
                            _c.trys.push([18, 23, , 24]);
                            if (!user.avatarUrl) return [3 /*break*/, 22];
                            localKey = user.avatarUrl.replace('/uploads/', '');
                            localPath = path.join(process.cwd(), 'uploads', localKey);
                            if (!fs.existsSync(localPath)) return [3 /*break*/, 22];
                            return [4 /*yield*/, fs.promises.readFile(localPath)];
                        case 19:
                            buffer = _c.sent();
                            return [4 /*yield*/, this.uploadToOSS(buffer, localKey)];
                        case 20:
                            url = (_c.sent()).url;
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: user.id },
                                    data: { avatarUrl: url },
                                })];
                        case 21:
                            _c.sent();
                            _c.label = 22;
                        case 22:
                            result.migrated++;
                            result.details.push({
                                type: 'user',
                                id: user.id,
                                status: 'success',
                            });
                            return [3 /*break*/, 24];
                        case 23:
                            error_4 = _c.sent();
                            result.failed++;
                            result.details.push({
                                type: 'user',
                                id: user.id,
                                status: 'failed',
                                error: error_4.message,
                            });
                            return [3 /*break*/, 24];
                        case 24:
                            _a++;
                            return [3 /*break*/, 17];
                        case 25: return [4 /*yield*/, this.prisma.note.findMany({
                                where: {
                                    coverImageUrl: {
                                        startsWith: '/uploads/',
                                    },
                                },
                                select: {
                                    id: true,
                                    coverImageUrl: true,
                                },
                            })];
                        case 26:
                            notes = _c.sent();
                            result.total += notes.length;
                            _b = 0, notes_1 = notes;
                            _c.label = 27;
                        case 27:
                            if (!(_b < notes_1.length)) return [3 /*break*/, 35];
                            note = notes_1[_b];
                            _c.label = 28;
                        case 28:
                            _c.trys.push([28, 33, , 34]);
                            if (!note.coverImageUrl) return [3 /*break*/, 32];
                            localKey = note.coverImageUrl.replace('/uploads/', '');
                            localPath = path.join(process.cwd(), 'uploads', localKey);
                            if (!fs.existsSync(localPath)) return [3 /*break*/, 32];
                            return [4 /*yield*/, fs.promises.readFile(localPath)];
                        case 29:
                            buffer = _c.sent();
                            return [4 /*yield*/, this.uploadToOSS(buffer, localKey)];
                        case 30:
                            url = (_c.sent()).url;
                            return [4 /*yield*/, this.prisma.note.update({
                                    where: { id: note.id },
                                    data: { coverImageUrl: url },
                                })];
                        case 31:
                            _c.sent();
                            _c.label = 32;
                        case 32:
                            result.migrated++;
                            result.details.push({
                                type: 'note',
                                id: note.id,
                                status: 'success',
                            });
                            return [3 /*break*/, 34];
                        case 33:
                            error_5 = _c.sent();
                            result.failed++;
                            result.details.push({
                                type: 'note',
                                id: note.id,
                                status: 'failed',
                                error: error_5.message,
                            });
                            return [3 /*break*/, 34];
                        case 34:
                            _b++;
                            return [3 /*break*/, 27];
                        case 35: return [2 /*return*/, result];
                        case 36:
                            error_6 = _c.sent();
                            this.logger.error("\u8FC1\u79FB\u5230OSS\u5931\u8D25: ".concat(error_6.message), error_6.stack);
                            throw new Error("\u8FC1\u79FB\u5230OSS\u5931\u8D25: ".concat(error_6.message));
                        case 37: return [2 /*return*/];
                    }
                });
            });
        };
        return StorageService_1;
    }());
    __setFunctionName(_classThis, "StorageService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StorageService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StorageService = _classThis;
}();
exports.StorageService = StorageService;
