angular.module("starter")
.factory('AuthService', function ($http, $q, $rootScope, $window, Restangular) {

    var svc = {};

    svc.token = null;
    svc.installToken = function(token){
        $http.defaults.headers.common.Authorization = "Token " + token;
        //window.localStorage.setItem("airbook_tk", token);
        $window.sessionStorage.airbook_tk = token;
        svc.token = token;
    };
    svc.removeToken = function(){
        //delete $http.defaults.headers.common.Authorization;
        delete $window.sessionStorage.airbook_tk;
        window.localStorage.removeItem("airbook_tk");
    }

    svc.doLogin = function(credentials){
        console.log(100, credentials)
        var deferred = $q.defer();
        //$http.post('http://localhost:8000/users/token-auth/', credentials)
        Restangular.all('users/token-auth').post(credentials)
        .then(function(response){
            console.log(1, response);
            svc.installToken(response.token);
            deferred.resolve(response);
        })
        .catch(function(err){
            deferred.reject(err);
        })
        return deferred.promise;
    };
    svc.doLogout = function(){
        svc.removeToken();
    };

    //tk = window.localStorage.getItem("airbook_tk");
    tk = $window.sessionStorage.airbook_tk;
    if(tk){
        svc.installToken(tk)
    }
    
    return svc;

})
