(function(){
    'use strict'

    angular.module('AnguRecords')
    .factory('restangularHelpers', ['$timeout', function ($timeout) {
        
        var svc = {}
        svc.saveItemFactory = function(postFunction, $scope, name){
            return function(item){
                if(item.id){
                    var out= item.put()
                    out.then(function(r){
                        $timeout(function(){
                            $scope[name] = r;
                        })
                    });
                    return out
                } else {
                    var out = postFunction(item)
                    out.then(function(r){
                        $timeout(function(){
                            $scope[name] = r;
                        });
                    });
                    return out;
                }
            }
        };

        svc.deleteItemFactory = function(){
            return function(item){
                return item.remove();
            }
        };
        return svc;
    }])
    


})();
