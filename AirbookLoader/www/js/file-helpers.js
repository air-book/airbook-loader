angular.module('starter')
.factory('fileHelpers', ['$q', function ($q) {
    var svc = {};
    svc.loadFile = function(fileMeta){
        var deferred = $q.defer();
        var reader = new FileReader()
        reader.onload = function(e){
            console.log("e",reader.result);
            var out = { 
                'uri' : reader.result,
                'filename' : fileMeta.name,
                'mime' : fileMeta.type
            }
            deferred.resolve(out);
        };
        reader.onerror = function(err){
            deferred.reject(err);
        };
        reader.readAsDataURL(fileMeta);
        return deferred.promise;
    };

    return svc;
}])