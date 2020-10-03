import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// array in local storage for registered users
let users = JSON.parse(localStorage.getItem('users')) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;

        // wrap in delayed observable to simulate server api call
        return of(null)
            .pipe(mergeMap(handleRoute))
            .pipe(materialize())
            .pipe(delay(500))
            .pipe(dematerialize());
        // tslint:disable-next-line: typedef
        function handleRoute() {
            switch (true) {
                case url.endsWith('/users/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/users/register') && method === 'POST':
                    return register();
                case url.endsWith('/users') && method === 'GET':
                    return getUsers();
                case url.match(/\/users\/\d+$/) && method === 'GET':
                    return getUserById();
                case url.match(/\/users\/\d+$/) && method === 'PUT':
                    return updateUser();
                case url.match(/\/users\/\d+$/) && method === 'DELETE':
                    return deleteUser();
                default:
                    // pass through any requests not handled above
                    return next.handle(request);
            }
        }

        // route functions

        // tslint:disable-next-line: typedef
        function authenticate() {
            const { username, password } = body;
            const user = users.find(x => x.username === username && x.password === password);
            if (!user) {
                return error('Username or password is incorrect');
            }
            return ok({
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                token: 'fake-jwt-token'
            });
        }

        // tslint:disable-next-line: typedef
        function register() {
            const user = body;

            if (users.find(x => x.username === user.username)) {
                return error('Username "' + user.username + '" is already taken');
            }

            user.id = users.length ? Math.max(...users.map(x => x.id)) + 1 : 1;
            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));
            return ok();
        }

        // tslint:disable-next-line: typedef
        function getUsers() {
            if (!isLoggedIn()) {
                return unauthorized();
            }
            return ok(users);
        }

        // tslint:disable-next-line: typedef
        function getUserById() {
            if (!isLoggedIn()) { return unauthorized(); }

            const user = users.find(x => x.id === idFromUrl());
            return ok(user);
        }


        // tslint:disable-next-line: typedef
        function updateUser() {
            if (!isLoggedIn()) { return unauthorized(); }

            const params = body;
            const user = users.find(x => x.id === idFromUrl());

            // only update password if entered
            if (!params.password) {
                delete params.password;
            }

            // update and save user
            Object.assign(user, params);
            localStorage.setItem('users', JSON.stringify(users));

            return ok();
        }

        // tslint:disable-next-line: typedef
        function deleteUser() {
            if (!isLoggedIn()) { return unauthorized(); }

            users = users.filter(x => x.id !== idFromUrl());
            localStorage.setItem('users', JSON.stringify(users));
            return ok();
        }

        // helper functions

        // tslint:disable-next-line: no-shadowed-variable
        // tslint:disable-next-line: typedef
        function ok(body?) {
            return of(new HttpResponse({ status: 200, body }));
        }

        // tslint:disable-next-line: typedef
        function error(message) {
            return throwError({ error: { message } });
        }

        // tslint:disable-next-line: typedef
        function unauthorized() {
            return throwError({ status: 401, error: { message: 'Unauthorised' } });
        }

        // tslint:disable-next-line: typedef
        function isLoggedIn() {
            return headers.get('Authorization') === 'Bearer fake-jwt-token';
        }

        // tslint:disable-next-line: typedef
        function idFromUrl() {
            const urlParts = url.split('/');
            // tslint:disable-next-line: radix
            return parseInt(urlParts[urlParts.length - 1]);
        }

    }
}

export const fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};
