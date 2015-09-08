angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, AuthService, $rootScope, Restangular) {
  // Form data for the login modal
  
  $rootScope.appUser = {};
  
  $rootScope.hasCordova = !!window.cordova;

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
              updating = false;
              $scope.hasNoBookshop = false;
              $scope.$broadcast('scroll.infiniteScrollComplete');
            })
        })
        .catch(function(err){
          $scope.hasNoBookshop = true;
        });
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


.controller('BookCtrl', function ($scope, Restangular, $timeout, $stateParams, fileHelpers, $cordovaCamera, $ionicModal) {
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

  $scope.dropBook = function(book){
    return book.remove()
  }

  $scope.undo = function(){
    $scope.book = angular.copy($scope.bookCopy); 
  };

  $scope.reorderBookImage = function(image){
    return Restangular.one('books/booksimages', image.id).patch({order:image.order})
  };

  $scope.dropBookImage = function(image){

    return Restangular.one('books/booksimages', image.id)
    .remove();
  };




  $scope.addImageFileSystem = function(files){
    if (files && files.length) {
        
      var file = files[0];
      fileHelpers.loadFile(file)
      .then(function(fileData){
        console.log("fileData", fileData);
        var newImage = {
          book : $scope.book.id,
          image : fileData
        };

        Restangular.all('books/booksimages')
        .post(newImage)
        .then(function(savedImage){
          $scope.book.images.push(savedImage);
        })
      
      })
        
    }
  };

  $scope.addImageCordova = function(){

    var options = {
      quality: 50,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      //targetWidth: 100,
      //targetHeight: 100,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
      var uri = "data:image/jpeg;base64," + imageData;
      var fileData = { uri : uri, filename : 'book-image.jpg' };
      var newImage = {
          book : $scope.book.id,
          image : fileData
        };

      Restangular.all('books/booksimages')
      .post(newImage)
      .then(function(savedImage){
        $scope.book.images.push(savedImage);
      })

    }, function(err) {
        
        console.error(err)
    });


  };

  $ionicModal.fromTemplateUrl('templates/author_modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.authorsData.newAuthor = null;
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

  $scope.authorsData = { autori : [], newAuthor : null };
  $scope.refreshAuthors = function(search){
    Restangular.all('books/booksauthors').getList({search:search})
    .then(function(authors){
      $timeout(function(){
        $scope.authorsData.raw = authors;
        $scope.authorsData.autori =  _.pluck(authors, 'name');
        
      })
    })
  }

  
  $scope.addAuthor = function(){
    $timeout(function(){
      $scope.openModal();   
    })
  };

  $scope.dropAuthor = function($index){
    $scope.book.authors.splice($index, 1);
    //$scope.book.patch({authors:$scope.book.authors});
  };

  $scope.createNewAuthor = function(){
    Restangular.all('books/booksauthors').post({name:$scope.authorsData.newAuthor})
    .then(function(savedAuthor){
      $scope.book.authors.push(savedAuthor);
      console.log(101, $scope.book);
      $scope.save();
      $scope.closeModal();
    
    })
  };


  $scope.chooseAndCloseModal = function(){
    var author = _.findWhere($scope.authorsData.raw, {name: $scope.authorsData.newAuthor })
    if(_.findWhere($scope.book.authors, {name: $scope.authorsData.newAuthor })){
      $scope.closeModal();
      return;
    }
    console.log(100, $scope.book);
    $scope.book.authors.push(author);
    $scope.save();
    $scope.closeModal();

  }

    
})

.controller('NewBookCtrl', function ($scope, Restangular, $timeout, $stateParams, $state) {

  $scope.book = {}

  $scope.save = function(){
    return Restangular.all('books/booksadmin').post($scope.book)
    .then(function(data){
      $state.go('app.books.detail', {bookId:data.id})
    });
  };
  
})

