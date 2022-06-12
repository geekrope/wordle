"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const index_1 = require("./routes/index");
const debug = require('debug')('my express app');
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'routes/public')));
app.use('/', index_1.default);
app.use((_req, _res, next) => {
    const err = new Error('Not Found');
    Object.defineProperty(err, 'status', {
        get: () => { return 404; }
    });
    next(err);
});
if (app.get('env') === 'development') {
    app.use((err, _req, res, _next) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
app.set('port', process.env["PORT"] || 3000);
const server = app.listen(app.get('port'), function () {
    debug(`Express server listening on port ${server.address().port}`);
});
//# sourceMappingURL=app.js.map