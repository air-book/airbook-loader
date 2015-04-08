angular.module('persitent-records', [])

.controller('PersistentCollectionCtrl', 
    ['$scope', '$attrs', '$timeout', '$q', '$ionicPopup',
    function ($scope, $attrs, $timeout, $q, $ionicPopup) {
        $scope.collectionStatus = {
            toDrop : {},
            numToDrop : 0,
            editable : false
        };


        $scope.$watch(
            function(){ return $scope.$eval($attrs.persistentCollection) },
            function(nv){ 
                if (!angular.isArray(nv)){
                    $scope.collection = []; 
                } else {
                    $scope.collection = nv; 
                }
            },
            true
        );

        var dropItemFunction = null;
        $scope.$watch(
            function(){ return $scope.$eval($attrs.dropItem) },
            function(nv){ 
                if (!angular.isFunction(nv)){
                    dropItemFunction = null; 
                } else {
                    dropItemFunction = nv; 
                }
            },
            true
        );

        var setItemOrderFunction = null;
        $scope.$watch(
            function(){ return $scope.$eval($attrs.reorderItem) },
            function(nv){ 
                if (!angular.isFunction(nv)){
                    setItemOrderFunction = null; 
                } else {
                    setItemOrderFunction = nv; 
                }
            },
            true
        );
        
        var itemKey;
        $scope.$watch(
            function(){ return $scope.$eval($attrs.itemKey) },
            function(nv){ 
                if (!angular.isString(nv)){
                    itemKey = null; 
                } else {
                    itemKey = nv;
                }
            },
            true
        );

        $scope.getKey  = function(item){
            return itemKey ? item[itemKey] : item;
        };


        $scope.dropItem = function(){

        };

        $scope.toReadMode = function(){
            $scope.collectionStatus.editable = false;
        }

        $scope.toEditMode = function(){
            $scope.collectionStatus.editable = true;
        }



        
        $scope.toggleToDrop = function(item, $event){
            if($event){
                $event.preventDefault();
            }
            var k = $scope.getKey(item);
            if(!$scope.collectionStatus.toDrop[k]){
                $scope.collectionStatus.toDrop[k] = item;
            } else {
                delete $scope.collectionStatus.toDrop[k];
            }

            $scope.collectionStatus.numToDrop = _.keys($scope.collectionStatus.toDrop).length;
            $timeout(function(){
                $scope.$apply();
            });
        };


        $scope.deleteRecords = function(switchToRead){
            
            var promises= [];
            angular.forEach($scope.collectionStatus.toDrop , function(item) {
                console.log("dropping ", item)
                var promise = dropItemFunction(item)
                .then(function(){
                    var pos = $scope.collection.indexOf(item);
                    $timeout(function(){
                        $scope.collection.splice(pos, 1);    
                    })
                    
                });
                promises.push(promise);

            });

            return $q.all(promises).then(function(){
                //humaneNotifications.success.log("Elementi eliminati");
                $scope.collectionStatus.toDrop = {};
                if(switchToRead){
                    $scope.toReadMode();
                }
            });

        };



        $scope.deleteRecordsWithConfirm = function(switchToRead) {
           var confirmPopup = $ionicPopup.confirm({
             title: 'Eliminazione record',
             template: 'Confermi l\'eliminazione di '+ $scope.collectionStatus.numToDrop +' elementi ?',
             cancelText : 'Annulla'
           });

           confirmPopup.then(function(res) {
             if(res) {
                return $scope.deleteRecords(switchToRead);
             } else {
               return;
             }
           });
         };

        $scope.moveItem = function(item, fromIndex, toIndex, orderField) {
            //Move the item in the array
            $scope.collection.splice(fromIndex, 1);
            $scope.collection.splice(toIndex, 0, item);
            //we must ensure that the order field is correct.
            var maxIndex = $scope.collection.length;
            for(var i=0;i<maxIndex;i++){
                if($scope.collection[i][orderField] != i){
                    $scope.collection[i][orderField] = i;
                    setItemOrderFunction($scope.collection[i]);
                    //$scope.reordered.push($scope.recordCollection[i]);
                }
                
            }

        };



    }
])


.directive('persistentCollection', [function () {
    return {
        restrict: 'A',
        scope : true,
        controller : 'PersistentCollectionCtrl'
            
        }
    
}])