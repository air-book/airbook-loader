angular.module('persitent-records', [])

.controller('PersistentCollectionCtrl', 
    ['$scope', '$attrs', '$timeout', '$q', '$ionicPopup', '$state',
    function ($scope, $attrs, $timeout, $q, $ionicPopup, $state) {
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
        };

        $scope.toEditMode = function(){
            $scope.collectionStatus.editable = true;
        };
        
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
                if(dropItemFunction instanceof Function){
                    var promise = dropItemFunction(item)
                    .then(function(){
                        var pos = $scope.collection.indexOf(item);
                        $timeout(function(){
                            $scope.collection.splice(pos, 1);    
                        })
                        
                    });
                    promises.push(promise);
                }

            });

            return $q.all(promises).then(function(){
                //humaneNotifications.success.log("Elementi eliminati");
                $scope.collectionStatus.toDrop = {};
                $scope.collectionStatus.numToDrop = 0;
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
            if(setItemOrderFunction instanceof Function){
                //we must ensure that the order field is correct.
                var maxIndex = $scope.collection.length;
                for(var i=0;i<maxIndex;i++){
                    if($scope.collection[i][orderField] != i){
                        $scope.collection[i][orderField] = i;
                        setItemOrderFunction($scope.collection[i]);
                        //$scope.reordered.push($scope.recordCollection[i]);
                    }
                }
            }
        };

    }
])


.controller('PersistentRecordCtrl', 
    ['$scope', '$attrs', '$timeout', '$q', '$ionicPopup', '$state',
    function ($scope, $attrs, $timeout, $q, $ionicPopup, $state) {
        $scope.recordStatus = {
            editable : false,
            waitingForServer : false,
            errors : null
        };

        $scope.$watch(
            function(){ return $scope.$eval($attrs.editable) },
            function(nv){ 
                if (!angular.isUndefined(nv)){
                    $scope.recordStatus.editable = nv; 
                } else {
                    $scope.recordStatus.editable = true; 
                }
            },
            true
        );


        $scope.$watch(
            function(){ return $scope.$eval($attrs.persistentRecord) },
            function(nv){ 
                if (!angular.isObject(nv)){
                    $scope.record = {}; 
                } else {
                    $scope.record = nv; 
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

        var saveItemFunction = null;
        $scope.$watch(
            function(){ return $scope.$eval($attrs.saveItem) },
            function(nv){ 
                if (!angular.isFunction(nv)){
                    saveItemFunction = null; 
                } else {
                    saveItemFunction = nv; 
                }
            },
            true
        );
        
        $scope.toReadMode = function(){
            $scope.recordStatus.editable = false;
        };

        $scope.toEditMode = function(){
            $scope.recordStatus.editable = true;
        };


        $scope.deleteWithConfirm = function(toState, toParams) {
           var confirmPopup = $ionicPopup.confirm({
             title: 'Eliminazione record',
             template: 'Confermi l\'eliminazione?',
             cancelText : 'Annulla'
           });
           confirmPopup.then(function(res) {
             if(res) {
                return $scope.delete(toState,toParams);
             } else {
               return;
             }
           });
         };


        $scope.delete = function(toState, toParams){
            $scope.recordStatus.waitingForServer = true;
            dropItemFunction($scope.record)
                .then(function(resp){
                    $scope.recordStatus.errors = null;
                    $scope.recordStatus.waitingForServer = false;
                    if(toState){
                        $state.go(toState, toParams);
                    }
                },
                function(resp){
                    $timeout(function(){
                        $scope.recordStatus.errors = resp.data;
                        $scope.recordStatus.waitingForServer = false;
                    });

                });
        };



        $scope.saveRecord = function(options){
            $scope.recordStatus.waitingForServer = true;
            return saveItemFunction($scope.record)
                .then(
                    function(saved){
                        //$scope.update();
                        $scope.recordStatus.errors = {};
                        if(options.toReadMode){
                            $scope.toReadMode();    
                        }
                    },
                    function(resp){
                        $scope.recordStatus.errors = resp.data;
                    }
                )
                .finally(function(){
                    $scope.recordStatus.waitingForServer = false;
                })
            
        };


        this.getRecord = function(){
            return $scope.record;
        }

        this.setValue = function(key, value){
            $scope.record[key] = value;
        }



    }
])


.directive('persistentCollection', [function () {
    return {
        restrict: 'A',
        scope : true,
        controller : 'PersistentCollectionCtrl'
            
    }
    
}])


.directive('persistentRecord', [function () {
    return {
        restrict: 'A',
        scope : true,
        controller : 'PersistentRecordCtrl'
    }
    
}])


.directive('persistentField', ['$compile', function($compile){
    return {
        restrict : 'A',
        require : ['^persistentRecord', '^form'],
        link: function (scope, element, attrs, controllers) {
            
            var fieldName = attrs.persistentField;
            var modelName = "record."+ fieldName;
            
            //remove peristent-field attr in order to avoid absolute recursion when recompiling
            element.removeAttr('persistent-field');
            
            attrs.$set('ngModel', modelName);
            attrs.$set('name', fieldName);

            var formCtrl = controllers[1];
            var formName = formCtrl.$name;
            
            if(attrs.persistentFieldInit != undefined){
                var recordController = controllers[0];
                var record = recordController.getRecord();
                if(record[fieldName] == undefined){
                    recordController.setValue(fieldName, scope.$eval(attrs.persistentFieldInit));
                }
            }

            //appending an error icon to label
            //very ionic-biased
            var par = $(element).parent();
            var label = $(par).find('.input-label');
            if(label.length){
                var newElm = '<i class="icon assertive ion-alert-circled" ng-if="'+formName+'.'+ fieldName +'.$invalid || recordStatus.errors.'+fieldName+'"> </i>';
                var el = $compile(newElm)(scope);
                label.prepend(el);
            };  

            //appending server error msg
            //very ionic-biased
            var newMsg = '<p class="item assertive" ng-if="recordStatus.errors.'+fieldName+'"><b>'+fieldName+'</b>: {{recordStatus.errors.'+fieldName+'[0]}}</p>';
            var el = $compile(newMsg)(angular.element(par[0]).scope());
            par.after(el);
            
            var tag = element.prop('tagName').toLowerCase();
            if((tag == 'input' && (attrs.type == 'text' || attrs.type == 'checkbox' || attrs.type == 'email' )) || tag == 'textarea' || tag == 'select'){

                if(!attrs.readonly && !attrs.ngDisabled){
                    if(tag == 'select'){
                        attrs.$set('ngDisabled', "recordStatus.editable==false || recordStatus.waitingForServer");        
                    }else{
                        attrs.$set('ngReadonly', "recordStatus.editable==false || recordStatus.waitingForServer");            
                    }
                    
                }
                attrs.$set('ngClass', "{'invalid-server' : errors."+fieldName+"}");
            }
            //recompile element after our modifications            
            $compile(element)(scope);
        }
    }

}])