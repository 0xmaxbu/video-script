import { r as require_token_util } from './chunk-C6BYMRIF.mjs';
import { b as __commonJS, c as require_token_error } from './index.mjs';
import '@mastra/core/evals/scoreTraces';
import '@mastra/core';
import '@mastra/core/agent';
import './tools/8bc8b48c-e26c-4ec5-92e3-4dc1df7734c2.mjs';
import '@mastra/core/tools';
import 'zod';
import './retry.mjs';
import 'ora';
import 'chalk';
import './tools/6cc136c1-ba1e-449f-8b97-4a039460c101.mjs';
import 'playwright';
import 'fs';
import 'path';
import './tools/9fa49f1e-7d11-4f1f-b0b5-d6c00461cc52.mjs';
import 'shiki';
import './tools/ec8b8b5f-7f84-4658-9b5b-839972058ba0.mjs';
import 'child_process';
import '@mastra/core/workflows';
import 'fs/promises';
import 'https';
import 'url';
import 'http';
import 'http2';
import 'stream';
import 'crypto';
import 'process';
import '@mastra/core/schema';
import '@mastra/core/utils/zod-to-json';
import 'zod/v3';
import 'module';
import '@mastra/core/workspace';
import '@mastra/core/processors';
import '@mastra/core/error';
import '@mastra/core/features';
import '@mastra/core/llm';
import '@mastra/core/request-context';
import '@mastra/core/utils';
import '@mastra/core/evals';
import '@mastra/core/storage';
import '@mastra/core/a2a';
import 'stream/web';
import 'zod/v4';
import '@mastra/core/memory';
import 'util';
import 'os';
import '@mastra/core/server';
import 'buffer';
import './tools.mjs';

// ../memory/dist/token-APYSY3BW-2DN6RAUY.js
var require_token = __commonJS({
  "../../../node_modules/.pnpm/@vercel+oidc@3.1.0/node_modules/@vercel/oidc/dist/token.js"(exports$1, module) {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var token_exports = {};
    __export(token_exports, {
      refreshToken: () => refreshToken
    });
    module.exports = __toCommonJS(token_exports);
    var import_token_error = require_token_error();
    var import_token_util = require_token_util();
    async function refreshToken() {
      const { projectId, teamId } = (0, import_token_util.findProjectInfo)();
      let maybeToken = (0, import_token_util.loadToken)(projectId);
      if (!maybeToken || (0, import_token_util.isExpired)((0, import_token_util.getTokenPayload)(maybeToken.token))) {
        const authToken = await (0, import_token_util.getVercelCliToken)();
        if (!authToken) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: Log in to Vercel CLI and link your project with `vc link`"
          );
        }
        if (!projectId) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: Try re-linking your project with `vc link`"
          );
        }
        maybeToken = await (0, import_token_util.getVercelOidcToken)(authToken, projectId, teamId);
        if (!maybeToken) {
          throw new import_token_error.VercelOidcTokenError("Failed to refresh OIDC token");
        }
        (0, import_token_util.saveToken)(maybeToken, projectId);
      }
      process.env.VERCEL_OIDC_TOKEN = maybeToken.token;
      return;
    }
  }
});
var tokenAPYSY3BW = require_token();

export { tokenAPYSY3BW as default };
