angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, AuthService, $rootScope, Restangular) {
  // Form data for the login modal
  
  $rootScope.appUser = {};
  $scope.loginData = {};

  $rootScope.logout = function(){
      AuthService.doLogout();
      $timeout(function(){
          $rootScope.appUser = {};
      });
  };

  if(AuthService.token){
      Restangular.oneUrl('users/me').get()
      .then(function(data){
          $timeout(function(){
              $rootScope.appUser = data;
          });
      });
  };


  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);
    return AuthService.doLogin($scope.loginData)
        .then(function(r){
            Restangular.oneUrl('users/me').get()
            .then(function(data){
                $timeout(function(){
                    $rootScope.appUser = data;
                });
                $scope.closeLogin();
            });
        });

  };


})


.controller('BooksCtrl', function ($scope, Restangular, $timeout) {
    console.log("Books")


    $scope.books = [];
    $scope.filters = {
        min_price : null,
        max_price : null,
        title_contains :null
    };
    var updating = false;
    $scope.rangeFilter = [0, 100]

    var updateFromServer = function(page){
        updating = true;
        var params = angular.copy($scope.filters);
        params.page = page;

        if(page == 1){
            $scope.books = [];
        }

        Restangular.all('books/books').getList(params)
        .then(function(data){
            $timeout(function(){
              console.log("response", data.metadata.count);
              $scope.books = $scope.books.concat(data);
              $scope.metadata = data.metadata;
              console.log(1, $scope.metadata)
              updating = false;
              $scope.$broadcast('scroll.infiniteScrollComplete');
            })
        });
    };

    $scope.updateBooks = function(){
        if(updating){return;}
        if($scope.metadata && $scope.metadata.next){
            updateFromServer($scope.metadata.number + 1);
        }
    };
    

    updateFromServer(1);

})


