(function(){
    'use strict'

    angular.module('AnguRecords', [])

    .controller('AnguCollectionCtrl', ['$scope', '$attrs', '$timeout',  '$state', '$ionicPopup', '$q',
     function ($scope, $attrs, $timeout,  $state, $ionicPopup, $q) {

        
        $scope.recordCollection = $scope.$eval($attrs.collection);     
        $scope.$watch(function(){
            return $scope.$eval($attrs.collection); 

            }, 
            function(nv,ov){
            if(ov != nv)
                $scope.recordCollection = nv;
                $scope.recordBackup = angular.copy($scope.recordCollection);

            }
            , true
        )
        

        $scope.removeItem = $scope.$eval($attrs.removeItem);
        $scope.saveItem = $scope.$eval($attrs.saveItem);

        $scope.toDrop = [];
        $scope.reordered = [];
        
        //#TODO: better check
        if(!angular.isObject($scope.recordCollection)){
            //console.error("xx",$scope.recordCollection)
            //throw new Error('Error in drfForm directive config: cannot parse object from recordCollection');    
        }
        
        
        $scope.uiStatus = {
            editMode : true,
            waitingForServer : false
        };

        $scope.$watch(
            function(v){if (v == '') return true; return $scope.$eval($attrs.editable) }, 
            function(nv){ $scope.uiStatus.editMode = nv; }
        );

        

        this.errors =$scope.errors = {};
        $scope.messages = [];

        $scope.isUnchanged = function() {
            return angular.equals($scope.record, $scope.recordCollection);
        };

        $scope.reset = function() {
            $scope.recordCollection = angular.copy($scope.recordCollection);
        };

        $scope.update = function() {
            $scope.recordCollection = angular.copy($scope.record);
        };

        $scope.toEditMode = function(){
            $timeout(function(){
                $scope.uiStatus.editMode = true;
                $scope.messages = [];
            });
        };

        $scope.toReadMode = function(){
            $timeout(function(){
                $scope.uiStatus.editMode = false;
            });
        };

        $scope.setToDrop=function(item){
            console.log("2,",item)
            $scope.toDrop.push(item);
        }

        $scope.isToDrop=function(item){
            return ($scope.toDrop.indexOf(item) !== -1);
        }

        $scope.removeToDrop=function(item){
            var pos = $scope.toDrop.indexOf(item);
            if(pos != -1){
                $scope.toDrop.splice(pos, 1);
            }
        };

        $scope.toggleToDrop = function(item, $event){
            $event.preventDefault()
            var pos = $scope.toDrop.indexOf(item);
            if(pos == -1){
                $scope.setToDrop(item);
            } else {
                $scope.toDrop.splice(pos, 1);
            }

        }

        $scope.deleteRecords = function(switchToRead){
            
            var promises= [];
            console.log("aaa", $scope.toDrop)
            angular.forEach($scope.toDrop , function(item) {
                console.log("aaa", item)
                var promise = $scope.removeItem(item).then(function(){
                    var pos = $scope.recordCollection.indexOf(item);
                    $timeout(function(){
                        $scope.recordCollection.splice(pos, 1);    
                    })
                    
                });
                promises.push(promise);

            });

            $q.all(promises).then(function(){
                //humaneNotifications.success.log("Elementi eliminati");
                $scope.toDrop = [];
                if(switchToRead){
                    $scope.toReadMode();
                }
            })

        }



        $scope.deleteRecordsWithConfirm = function(switchToRead) {
           var confirmPopup = $ionicPopup.confirm({
             title: 'Eliminazione record',
             template: 'Confermi l\'eliminazione di '+ $scope.toDrop.length +' elementi ?',
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
            $scope.recordCollection.splice(fromIndex, 1);
            $scope.recordCollection.splice(toIndex, 0, item);
            //we must ensure that the order field is correct.
            var maxIndex = $scope.recordCollection.length;
            for(var i=0;i<maxIndex;i++){
                if($scope.recordCollection[i][orderField] != i){
                    $scope.recordCollection[i][orderField] = i;
                    $scope.saveItem($scope.recordCollection[i]);
                    //$scope.reordered.push($scope.recordCollection[i]);
                }
                
            }

        };
        
    }])


    .controller('AnguRecordCtrl', ['$scope', '$attrs', '$timeout', '$state', '$ionicPopup', '$q',
     function ($scope, $attrs, $timeout,  $state, $ionicPopup, $q) {
        
        
        if(angular.isDefined($attrs.drfSubRecord)){
            $scope.record = $scope.$eval($attrs.drfSubRecord);    
            $scope.recordBackup = angular.copy($scope.record);
        } else {
            $scope.record = $scope.$eval($attrs.anguRecord);    
            $scope.recordBackup = angular.copy($scope.record);
        }

        //#todo: think about this.
        $scope.$watch(
            function(){
                if(angular.isDefined($attrs.drfSubRecord)){
                    return $scope.$eval($attrs.drfSubRecord);    
                } else {
                    return $scope.$eval($attrs.anguRecord);    
                }
            }, 
            function(nv,ov){
                if(ov != nv){
                    $scope.record = nv;
                    $scope.recordBackup = angular.copy($scope.record);
                }
                //#TODO: better check
                if(!angular.isObject($scope.record)){
                    throw new Error('Error in drfRecord directive config: cannot parse object from record');    
                }
            }, 
            true
        );

        $scope.debugName = $attrs.debugName;
        
        
        $scope.removeItem = $scope.$eval($attrs.removeItem);
        $scope.saveItem = $scope.$eval($attrs.saveItem);
        $scope.subRecords = [];
        

        
        $scope.uiStatus = {
            editMode : true,
            waitingForServer : false
        };

        $scope.$watch(
            function(v){if (v == '') return true; return $scope.$eval($attrs.editable) }, 
            function(nv){ $scope.uiStatus.editMode = nv; }
        );

        this.errors =$scope.errors = {};
        $scope.messages = [];

        $scope.isUnchanged = function() {
            var meUnchanged =  angular.equals($scope.record, $scope.recordBackup);
            if(!meUnchanged) { return false; }
            var childrenUnchanged = true;
            _.each($scope.subRecords, function(item, i){
                if(!item.isUnchanged()){
                    childrenUnchanged = false;
                    return false;
                }
            })

            return childrenUnchanged;
        };

        $scope.reset = function() {

            $timeout(function(){
                console.log($scope.record, $scope.recordBackup)
                $scope.record = angular.copy($scope.recordBackup);
            });
        };

        $scope.update = function() {
            $scope.recordBackup = angular.copy($scope.record);
        };

        $scope.toEditMode = function(){
            $timeout(function(){
                $scope.uiStatus.editMode = true;
                $scope.messages = [];
                $scope.$broadcast('toEditMode', $scope.uiStatus.editMode);
            });
        };

        $scope.toReadMode = function(){
            $timeout(function(){
                $scope.uiStatus.editMode = false;
            });
        };


        $scope.save = function(options){
            options =  options || {};
            //
            var deferred = $q.defer();
            var lSub = $scope.subRecords.length;
            var queue = [];
            if(lSub){
                
                for(var i=0;i<lSub;i++){
                    var subRecordScope = $scope.subRecords[i];
                    if(subRecordScope.$dirty){
                        var prom = subRecordScope.save()
                        queue.push(prom)
                    }
                }
            }

            var x = $q.all(queue);
            x.then(function(results){
                
                if(results.length != queue.length){
                    deferred.reject("Errors while saving subforms!")
                    return;
                }
                $scope.saveItem($scope.record)
                .then(function(saved){
                    deferred.resolve(saved);    
                    $scope.update();
                    $scope.errors = {};
                    if(options.toReadMode){
                        $scope.toReadMode();    
                    }
                })
                .catch(function(err){
                    if(err.data){
                        $timeout(function(){
                            $scope.errors = err.data;
                        });
                    }
                })
                

            });

            return deferred.promise;
            
        };
        

        

        $scope.deleteWithConfirm = function(toState,toParams) {
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


        $scope.delete = function(toState,toParams){
            $scope.uiStatus.waitingForServer = true;
            $scope.removeItem($scope.record)
                .then(function(resp){
                    if(toState){
                        $state.go(toState, toParams);
                    }
                },
                function(resp){
                    $timeout(function(){
                        $scope.errors = resp.data;
                        $scope.messages = [{
                            text : 'Impossibile eliminare il record'
                        }];
                        $scope.uiStatus.waitingForServer = false;
                    });

                });
        };
        

        this.getRecord = function(){
            return $scope.record;
        }

        this.setValue = function(key, value){
            $scope.record[key] = value;
        }

        this.addSubRecord = function(subRecordScope){
            $scope.subRecords.push(subRecordScope);
            console.log("x -> subrecords", $scope.record, $scope.subRecords);
            return $scope;
        }


        $scope.$watch(function(){return angular.equals($scope.record, $scope.recordBackup)},
            function(nv){ $scope.hasChanges=true }, true);


        
    }])


    .directive('anguRecordCollection', [
        function(){
        return {
            restrict : 'A',
            controller : 'AnguCollectionCtrl'
        }
    }])


    .directive('anguRecord', [
        function(){
        return {
            restrict : 'A',
            scope:true,
            controller : 'AnguRecordCtrl'
        }

    }])
    
    
    .directive('anguField', ['$compile', function($compile){
        return {
            restrict : 'A',
            require : ['^anguRecord', '^form'],
            link: function (scope, element, attrs, controllers) {
                
                var fieldName = attrs.anguField;
                var modelName = "record."+ fieldName;
                element.removeAttr('angu-field');
                attrs.$set('ngModel', modelName);
                attrs.$set('name', fieldName);

                var formCtrl = controllers[1];
                var formName = formCtrl.$name;
                
                if(attrs.anguFieldInit != undefined){
                    var recordController = controllers[0];
                    var record = recordController.getRecord()
                    if(record[fieldName] == undefined){
                        //record[fieldName] = scope.$eval(attrs.anguFieldInit);
                        recordController.setValue(fieldName, scope.$eval(attrs.anguFieldInit));
                    }
                }

                //appending an error icon to label
                var par = element.parent();
                var label = par.find('.input-label');
                if(label.length){
                    var newElm = '<i class="icon icon-error ion-alert-circled" ng-if="'+formName+'.'+ fieldName +'.$invalid || errors.'+fieldName+'"> </i>';
                    var el = $compile(newElm)(scope);
                    label.append(el);
                };  

                //appending server error msg
                //var newMsg = '<div ng-if="'+formName+'.'+ fieldName +'.$invalid || errors.'+fieldName+'">{{errors.'+fieldName+'}}</div>';
                //var el = $compile(newMsg)(angular.element(par[0]).scope());
                //par.append(el);
                
                var tag = element.prop('tagName').toLowerCase();
                if((tag == 'input' && (attrs.type == 'text' || attrs.type == 'checkbox' || attrs.type == 'email' )) || tag == 'textarea' || tag == 'select'){

                    if(!attrs.readonly && !attrs.ngDisabled){
                        if(tag == 'select'){
                            attrs.$set('ngDisabled', "uiStatus.editMode==false || uiStatus.waitingForServer");        
                        }else{
                            attrs.$set('ngReadonly', "uiStatus.editMode==false || uiStatus.waitingForServer");            
                        }
                        
                    }
                    attrs.$set('ngClass', "{'invalid-server' : errors."+fieldName+"}");
                }
                
                $compile(element)(scope);
            }
        }

    }])

    .directive('elasticArea', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('keypress', function(){
                    element.css('height',element[0].scrollHeight + "px");
                })


                
            }
        };
    }])



    /*



    .directive('drfSubRecord', [function($timeout, $state){
        return {
            restrict : 'A',
            scope : true,
            require : ['^drfRecord', '^form'],
            controller : 'drfRecordCtrl',
            

            link : function(scope, elem, attrs, controllers){

                var fieldName = attrs.fieldName;
                
                //console.log(1, scope.drfSubRecord(), drfRecord);

                var formController = controllers[1];
                scope.$watch(
                    function(){return formController.$dirty; }, 
                    function(nv){scope.$dirty=nv },
                    true)
                var drfRecordController = controllers[0];

                scope.parentRecord = drfRecordController.addSubRecord(scope);


                scope.dropSubRecord = function(){
                    //remove from parent record
                    drfRecordController.setValue(fieldName, null);
                    scope.parentRecord.save().then(function(){
                        scope.delete();
                        scope.record = {};
                    });


                }
                    
                scope.$on('toEditMode', function(evt, value){
                    $timeout(function(){
                        scope.uiStatus.editMode = value;
                    })
                });

                scope.$on('recordSaved', function(evt, value){
                    $timeout(function(){
                        console.log("ww main record saved",value, formController)
                        if(formController.$dirty){
                            scope.save()
                        }
                    })
                });
                

                console.log("xx", scope.record)




            },





            
        }

    }])
    
    
    // #TODO: this is a WORK-IN.PROGRESS.
    // #PROBABLY IT WILL THASHED ..

    .directive('drfImageField', ['$compile', function($compile){
        return {
            restrict : 'A',
            template : '<input type="file"/>',
            replace : true,
            require : ['^drfRecord', '^form'],
            link: function (scope, element, attrs, controllers) {
                

                var fieldName = attrs.drfImageField;
                //element.removeAttr('drf-image-field');
                var recordController = controllers[0];
                var record = recordController.getRecord();
                console.log("xx", record);

                var formController = controllers[1];
                console.log("33", formController)
                

                //here we can leverage on customPUT method of the restangular resource
                //record.customPUT
                var url = record.getRequestedUrl()
                
                $(element).on('change', function(files){
                    console.log("xx1", files);
                    var formData = new FormData();
                    formData.append('id', record.id)
                    formData.append(fieldName, $(element))
                    console.log("33", formData)

                    var xhr = new XMLHttpRequest();
                    xhr.open('PUT', url+"/", true);
                    xhr.send(formData);

                });



            }
        }

    }]);

    */


})();