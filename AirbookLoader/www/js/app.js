// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'restangular', 'persitent-records', 'angularFileUpload', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, RestangularProvider) {

  var baseServerUrl = '/';
  RestangularProvider.setBaseUrl(baseServerUrl);

  RestangularProvider.setResponseExtractor(function(response, operation, what, url) {
      var newResponse;
      if (operation === "getList") {
          newResponse = response.results != undefined ? response.results : response;
          newResponse.metadata = {
            count : response.count,
            next : response.next,
            previous : response.previous,
            number : response.number,
          }
      } else {
          newResponse = response;
      }
      return newResponse;
  });

  RestangularProvider.setRequestSuffix('/?');



  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html"
  })

  .state('app.home', {
    url : '/home',
    views: {
      'menuContent': {
        templateUrl: "templates/home.html"
      }
    }
  })

  .state('app.books', {
    abstract : true,
    views: {
      'menuContent': {
        template: "<ion-nav-view></ion-nav-view>"
      }
    }
  })

  .state('app.books.list', {
    url : '/books',
    cache : false,
    views: {
      '': {
        templateUrl: "templates/books.html",
        controller : 'BooksCtrl'
      }
    }
  })

  .state('app.books.new', {
    url : '/new',
    cache : false,
    views: {
      '': {
        templateUrl: "templates/book.html",
        controller : 'NewBookCtrl'
      }
    }
  })

  .state('app.books.detail', {
    url : '/book/:bookId',
    views: {
      '': {
        templateUrl: "templates/book.html",
        controller : 'BookCtrl'
      }
    }
  });



  
  
  

  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
