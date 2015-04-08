angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, AuthService, $rootScope, Restangular) {
  // Form data for the login modal
  
  $rootScope.appUser = {};
  $scope.loginData = {};

  $rootScope.logout = function(){
      AuthService.doLogout();
      $timeout(function(){
          $rootScope.appUser = {};
          $rootScope.$broadcast('logoutSuccess');
      });
  };

  if(AuthService.token){
      Restangular.oneUrl('users/me').get()
      .then(function(data){
          $timeout(function(){
              $rootScope.appUser = data;
              $rootScope.$broadcast('loginSuccess');
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
                    $rootScope.$broadcast('loginSuccess');
                });
                $scope.closeLogin();
            });
        });

  };


})


.controller('BooksCtrl', function ($scope, Restangular, $timeout) {
    console.log("Books")


    $scope.books = [];
    $scope.hasNoBookshop = false;
    $scope.filters = {
        min_price : null,
        max_price : null,
        title_contains :null
    };
    var updating = false;
    $scope.rangeFilter = [0, 100]

    var updateFromServer = function(page){
        if(updating){
          return;
        }
        updating = true;
        var params = angular.copy($scope.filters);
        params.page = page;

        if(page == 1){
            $scope.books = [];
        }

        Restangular.all('books/booksadmin').getList(params)
        .then(function(data){
            $timeout(function(){
              $scope.books = $scope.books.concat(data);
              $scope.metadata = data.metadata;
              console.log(1, $scope.metadata)
              updating = false;
              $scope.hasNoBookshop = false;
              $scope.$broadcast('scroll.infiniteScrollComplete');
            })
        })
        .catch(function(err){
          
          $scope.hasNoBookshop = true;
        })
    };

    $scope.updateBooks = function(){
        if(updating){return;}
        if($scope.metadata && $scope.metadata.next){
            updateFromServer($scope.metadata.number + 1);
        }
    };
    

    updateFromServer(1);

    $scope.$on('loginSuccess', function(){
      updateFromServer(1);      
    })

    $scope.$on('logoutSuccess', function(){
      $scope.books = [];
    })

})


.controller('BookCtrl', function ($scope, Restangular, $timeout, $stateParams) {
  $scope.book= {};
  $scope.ui = { deleteImages:false, reorderImages:false }

  $scope.toggleUi = function(k){
    $scope.ui[k] = !!!$scope.ui[k];
  };

  Restangular.all('books/booksadmin').get($stateParams.bookId)
  .then(function(data){
    $scope.book = data;
    $scope.bookCopy = angular.copy($scope.book);
  })

  $scope.save = function(){
    $scope.bookCopy = angular.copy($scope.book);
    return $scope.book.patch();
  };

  $scope.undo = function(){
    $scope.book = angular.copy($scope.bookCopy); 
  };


  $scope.reorderBookImage = function(imgData){
    Restangular.one('books/booksimages', imgData.id).patch({order:imgData.order})
  };

  $scope.dropBookImage = function(imgData){

    Restangular.one('books/booksimages', imgData.id)
    .remove()
    .then(function(){
      $scope.book.images = _.reject($scope.book.images, function(item){
        return item.id == imgData.id;
      })
    })
  };


  $scope.moveItem = function(item, fromIndex, toIndex, orderField) {
      //Move the item in the array
      $scope.book.images.splice(fromIndex, 1);
      $scope.book.images.splice(toIndex, 0, item);
      //we must ensure that the order field is correct.
      var maxIndex = $scope.book.images.length;
      for(var i=0;i<maxIndex;i++){
          if($scope.book.images[i][orderField] != i){
              $scope.book.images[i][orderField] = i;
              $scope.reorderBookImage($scope.book.images[i]);
          }
          
      }

  };
    
})

.controller('NewBookCtrl', function ($scope, Restangular, $timeout, $stateParams, $state) {
  $scope.book = {}

  $scope.save = function(){
    return Restangular.all('books/booksadmin').post($scope.book)
    .then(function(data){
      console.log(data)
      $state.go('app.books.detail', {bookId:data.id})
    })
  }

  
})

