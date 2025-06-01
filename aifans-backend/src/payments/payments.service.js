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
exports.PaymentsService = void 0;
var common_1 = require("@nestjs/common");
var alipay_sdk_1 = require("alipay-sdk");
var PaymentsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PaymentsService = _classThis = /** @class */ (function () {
        function PaymentsService_1(prisma, alipayConfig) {
            this.prisma = prisma;
            this.alipayConfig = alipayConfig;
            this.logger = new common_1.Logger(PaymentsService.name);
            // 初始化支付宝 SDK
            this.alipaySdk = new alipay_sdk_1.AlipaySdk({
                appId: this.alipayConfig.appId,
                privateKey: this.alipayConfig.privateKey,
                alipayPublicKey: this.alipayConfig.alipayPublicKey,
                gateway: 'https://openapi.alipay.com/gateway.do',
                signType: 'RSA2',
            });
        }
        PaymentsService_1.prototype.createOrder = function (userId, createOrderDto) {
            return __awaiter(this, void 0, void 0, function () {
                var product, order, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("\u521B\u5EFA\u8BA2\u5355: \u7528\u6237ID=".concat(userId, ", \u4EA7\u54C1ID=").concat(createOrderDto.productId));
                            product = {
                                id: createOrderDto.productId,
                                title: '会员产品',
                                price: 99.0,
                                description: '会员产品描述',
                            };
                            order = {
                                id: Math.floor(Math.random() * 10000),
                                userId: userId,
                                productId: product.id,
                                amount: product.price,
                                status: 'PENDING',
                                product: product
                            };
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.alipaySdk.exec('alipay.trade.page.pay', {
                                    method: 'GET',
                                    bizContent: {
                                        outTradeNo: "ORDER_".concat(order.id),
                                        productCode: 'FAST_INSTANT_TRADE_PAY',
                                        totalAmount: order.amount.toString(),
                                        subject: "AI\u7075\u611F\u793E - ".concat(product.title),
                                        body: product.description,
                                    },
                                    returnUrl: "".concat(this.alipayConfig.returnUrl, "?orderId=").concat(order.id),
                                    notifyUrl: this.alipayConfig.notifyUrl,
                                })];
                        case 2:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    orderId: order.id,
                                    paymentUrl: result,
                                }];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error("\u521B\u5EFA\u652F\u4ED8\u5931\u8D25: ".concat(error_1.message), error_1.stack);
                            throw new common_1.BadRequestException('创建支付失败: ' + error_1.message);
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        PaymentsService_1.prototype.handleAlipayNotification = function (notifyData) {
            return __awaiter(this, void 0, void 0, function () {
                var isValid, outTradeNo, tradeStatus, alipayTradeNo, orderId;
                return __generator(this, function (_a) {
                    isValid = this.alipaySdk.checkNotifySign(notifyData);
                    if (!isValid) {
                        return [2 /*return*/, { success: false, message: '签名验证失败' }];
                    }
                    outTradeNo = notifyData.out_trade_no;
                    tradeStatus = notifyData.trade_status;
                    alipayTradeNo = notifyData.trade_no;
                    orderId = parseInt(outTradeNo.replace('ORDER_', ''));
                    this.logger.log("\u652F\u4ED8\u5B9D\u901A\u77E5: \u8BA2\u5355ID=".concat(orderId, ", \u4EA4\u6613\u72B6\u6001=").concat(tradeStatus));
                    // 处理交易状态（伪代码）
                    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
                        // 更新用户会员状态（伪代码）
                        return [2 /*return*/, { success: true, message: '订单处理成功' }];
                    }
                    else if (tradeStatus === 'TRADE_CLOSED') {
                        return [2 /*return*/, { success: true, message: '订单已关闭' }];
                    }
                    return [2 /*return*/, { success: true, message: '订单状态已记录' }];
                });
            });
        };
        PaymentsService_1.prototype.getOrderStatus = function (orderId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var order;
                return __generator(this, function (_a) {
                    order = {
                        id: orderId,
                        userId: userId,
                        status: 'PENDING',
                        amount: 99.0,
                        product: {
                            id: 1,
                            title: '会员产品',
                        },
                        createdAt: new Date(),
                    };
                    if (order.userId !== userId) {
                        throw new common_1.UnauthorizedException('无权访问此订单');
                    }
                    return [2 /*return*/, {
                            orderId: order.id,
                            status: order.status,
                            amount: order.amount,
                            product: {
                                id: order.product.id,
                                title: order.product.title,
                            },
                            createdAt: order.createdAt,
                        }];
                });
            });
        };
        // 定时任务：每天检查过期的高级会员，并将其降级为普通会员
        // 注意：Cron装饰器已被移除，因为TypeScript装饰器版本兼容问题
        PaymentsService_1.prototype.checkExpiredMemberships = function () {
            return __awaiter(this, void 0, void 0, function () {
                var now, expiredCount;
                return __generator(this, function (_a) {
                    now = new Date();
                    this.logger.log('检查过期会员...');
                    expiredCount = 0;
                    if (expiredCount > 0) {
                        this.logger.log("\u5DF2\u5C06 ".concat(expiredCount, " \u4E2A\u8FC7\u671F\u4F1A\u5458\u964D\u7EA7\u4E3A\u666E\u901A\u7528\u6237"));
                    }
                    return [2 /*return*/];
                });
            });
        };
        return PaymentsService_1;
    }());
    __setFunctionName(_classThis, "PaymentsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsService = _classThis;
}();
exports.PaymentsService = PaymentsService;
