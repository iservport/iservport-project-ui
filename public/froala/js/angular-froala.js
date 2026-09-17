(function(window, angular, undefined) {
  'use strict';

  angular.module('froala', [])
    .value('froalaConfig', {
        key: "qc1H2pE1B3A2B6B6B5oCe1ZSc2XHe1Cd1f1KIWCWMJHXCLSwD1D1D1G1F1H4C11B1C6D4=="
    })
    .directive('froala', ['froalaConfig', '$http', function(froalaConfig, $http) {
      "use strict"; //Scope strict mode to only this directive
      var generatedIds = 0;
      var defaultConfig = {
        immediateAngularModelUpdate: false,
        angularIgnoreAttrs: null,
        fileMaxSize: 1024 * 1024 * 150
      };

      var innerHtmlAttr = 'innerHTML';

      var scope = {
        froalaOptions: '=froala',
        initFunction:  '&froalaInit'
      };

      froalaConfig = froalaConfig || {};

      // Constants
      var MANUAL = "manual";
      var AUTOMATIC = "automatic";
      var SPECIAL_TAGS = ['img', 'button', 'input', 'a'];

      return {
        restrict: 'A',
        require: 'ngModel',
        scope: scope,
        link: function(scope, element, attrs, ngModel) {
            // Create a blur event to update the data of ngModel
            element.on('blur', function () {
              ngModel.$setViewValue(element[0].innerHTML)
            });


          var specialTag = false;
          if (SPECIAL_TAGS.indexOf(element.prop("tagName").toLowerCase()) !== -1) {
            specialTag = true;
          }

          var ctrl = {
            editorInitialized: false
          };

          var firstTime = false;

          scope.initMode = attrs.froalaInit ? MANUAL : AUTOMATIC;

          ctrl.init = function() {
            if (!attrs.id) {
              // generate an ID if not present
              attrs.$set('id', 'froala-' + generatedIds++);
            }

            //init the editor
            if (scope.initMode === AUTOMATIC) {
              ctrl.createEditor();
            }

            //Instruct ngModel how to update the froala editor
            ngModel.$render = function () {
              // Update special tags.
              if (specialTag) {
                var tags = ngModel.$modelValue;

                // add tags on element
                if (tags) {
                  for (var attr in tags) {
                    if (tags.hasOwnProperty(attr) && attr !== innerHtmlAttr) {
                      element.attr(attr, tags[attr]);
                    }
                  }
                  if (tags.hasOwnProperty(innerHtmlAttr)) {
                    element[0].innerHTML = tags[innerHtmlAttr];
                  }
                }
              }
              else {
                if (ctrl.editorInitialized) {
                  // Set HTML.
                  ctrl.froalaEditor.html.set(ngModel.$viewValue || '')
                  //This will reset the undo stack everytime the model changes externally. Can we fix this?
                  ctrl.froalaEditor.undo.reset();
                  ctrl.froalaEditor.undo.saveStep();
                }
              }
            };

            ngModel.$isEmpty = function(value) {
              if (!value) {
                return true;
              }

              return true;
            };
          };

          ctrl.createEditor = function(froalaInitOptions) {
            if (!ctrl.editorInitialized) {
              froalaInitOptions = (froalaInitOptions || {});
              ctrl.options = angular.extend({}, defaultConfig, froalaConfig, scope.froalaOptions, froalaInitOptions);

              ctrl.registerEventsWithCallbacks('initializationDelayed', function() {
                ngModel.$render()
              });

              ctrl.registerEventsWithCallbacks('initialized', ctrl.options.events && ctrl.options.events.initialized)
              var initEvent = ctrl.options.events.initialized;
              if (!ctrl.options.events) ctrl.options.events = {};
              ctrl.options.events.initialized = function () {
                initEvent && initEvent();
                ctrl.initListeners();
                ctrl.editorInitialized = true;
                ngModel.$render()
              };
              ctrl.froalaEditor = new FroalaEditor(element[0], ctrl.options);

              //assign the froala instance to the options object to make methods available in parent scope
              if (scope.froalaOptions) {
                scope.froalaOptions.froalaEditor = ctrl.froalaEditor;
              }
            }
          };

          ctrl.initListeners = function() {
            if (ctrl.options.immediateAngularModelUpdate) {
              ctrl.froalaEditor.events.on('keyup', function() {
                scope.$evalAsync(ctrl.updateModelView);
              });
            }

            ctrl.froalaEditor.events.on('contentChanged', function() {
              scope.$evalAsync(ctrl.updateModelView);
            });

//
            if (ctrl.initEvents) {
              for (var i = 0; i < ctrl.initEvents; i++) {
                ctrl.initEvents[i].call(ctrl.froalaEditor);
              }
            }

            element.bind('$destroy', function() {
              if (element) {
                ctrl.froalaEditor.destroy();
                element = null;
              }
            });
          };

          ctrl.updateModelView = function() {
            if (!element) {
              return;
            }

            var modelContent = null;

            if (specialTag) {
              var attributeNodes = element[0].attributes;
              var attrs = {};

              for (var i = 0; i < attributeNodes.length; i++) {
                var attrName = attributeNodes[i].name;
                if (ctrl.options.angularIgnoreAttrs && ctrl.options.angularIgnoreAttrs.indexOf(attrName) !== -1) {
                  continue;
                }
                attrs[attrName] = attributeNodes[i].value;
              }
              if (element[0].innerHTML) {
                attrs[innerHtmlAttr] = element[0].innerHTML;
              }
              modelContent = attrs;
            } else {
              var returnedHtml = ctrl.froalaEditor.html.get();
              if (angular.isString(returnedHtml)) {
                modelContent = returnedHtml;
              }
            }

            ngModel.$setViewValue(modelContent);
            if (!scope.$root.$$phase) {
              scope.$apply();
            }
          };

          ctrl.registerEventsWithCallbacks = function(eventName, callback) {
            if (eventName && callback) {
              if(!ctrl.options.events){
                ctrl.options.events = {};
              }

              if (eventName === 'initialized') {
                if (!ctrl.initEvents) ctrl.initEvents = [];
                ctrl.initEvents.push(callback);
              }
              else {
                ctrl.options.events[eventName] = callback;
              }
            }
          };

          if (scope.initMode === MANUAL) {
            var _ctrl = ctrl;
            var controls = {
              initialize: ctrl.createEditor,
              destroy: function() {
                if (_ctrl.froalaEditor) {
                  _ctrl.froalaEditor.destroy();
                  _ctrl.editorInitialized = false;
                }
              },
              getEditor: function() {
                return _ctrl.froalaEditor ? _ctrl.froalaEditor : null;
              }
            };
            scope.initFunction({
              initControls: controls
            });
          }
          ctrl.init();
        }
      };
    }])
    .directive('froalaView', ['$sce', function($sce) {
      return {
        restrict: 'ACM',
        scope: false,
        link: function(scope, element, attrs) {
          element.addClass('fr-view');
          scope.$watch(attrs.froalaView, function(nv) {
            if (nv || nv === '') {
              var explicitlyTrustedValue = $sce.trustAsHtml(nv);
              element.html(explicitlyTrustedValue.toString());
            }
          });
        }
      };
    }])
    .directive('froalaWrapper', ['froalaConfig', function(froalaConfig) {
        return {
            restrict: 'C',
            controller: ['$scope', function ($scope) {
                $scope.froalaOptions = {
                    toolbarInline: false
                    ,attribution: false
                    ,theme: 'gray'
                    ,imageUploadURL: '/app/storage/froala'
                    ,fileUploadURL: '/app/storage/froala'
                    ,imageUploadParams: {
                        uploadAs: $scope.baseName
                        ,uploadId: $scope.folderValue
                        ,_csrf: $scope.csrf
                    }
                    ,fileUploadParams: {
                        uploadAs: $scope.baseName
                        ,uploadId: $scope.folderValue
                        ,_csrf: $scope.csrf
                    }
                    ,events: {
                        'image.beforeUpload': function (images) {
                            $scope.froalaOptions.imageUploadParams.uploadId = $scope.folderValue;
                        }
                        ,'file.beforeUpload': function (files) {
                            // Check if the file is a PDF
                            if (files.length && files[0].type === 'application/pdf') {
                                // Prevent the default upload behavior
                                event.preventDefault();

                                // Create the object tag for the PDF
                                var objectTag = '<object data="' + URL.createObjectURL(files[0]) + '" type="application/pdf" width="100%" height="400"></object>';

                                // Insert the object tag into the editor
                                ctrl.froalaEditor.html.insert(objectTag);

                                if (files.length && files[0].type === 'application/pdf') {
                                    event.preventDefault();

                                    var formData = new FormData();
                                    formData.append('file', files[0]);
                                    formData.append('uploadId', $scope.folderValue);
                                    formData.append('uploadAs', $scope.baseName);

                                    $http({
                                        method: 'POST',
                                        url: '/app/storage/froala',
                                        data: formData,
                                        headers: {
                                            'Content-Type': undefined // This is important to set the Content-Type as multipart/form-data
                                        },
                                        transformRequest: angular.identity // Prevents Angular from serializing our FormData object
                                    }).then(function successCallback(response) {
                                        console.log('File uploaded successfully', response);
                                        // Create the object tag for the PDF with the server URL
                                        var objectTag = '<object data="' + response.data.link + '" type="application/pdf" width="100%" height="400"></object>';

                                        // Insert the object tag into the editor
                                        ctrl.froalaEditor.html.insert(objectTag);

                                    }, function errorCallback(response) {
                                        console.error('Error uploading file', response);
                                    });

                                    return false;
                                }

                                return false; // Stop the default file upload process
                            }
                        }
                    }
                }
            }]
        };
    }])
      .directive('froalaWrapperIl', ['froalaConfig', function(froalaConfig) {
          return {
              restrict: 'C',
              controller: ['$scope', function ($scope) {
                  $scope.froalaOptions = {
                      toolbarInline: false
                      ,initOnClick: false
                      ,attribution: false
                      ,theme: 'gray'
                      ,imageUploadURL: '/app/storage/froala'
                      ,fileUploadURL: '/app/storage/froala'
                      ,imageUploadParams: {
                          uploadAs: $scope.baseName
                          ,uploadId: $scope.folderValue
                          ,_csrf: $scope.csrf
                      }
                      ,fileUploadParams: {
                          uploadAs: $scope.baseName
                          ,uploadId: $scope.folderValue
                          ,_csrf: $scope.csrf
                      }
                      ,events: {
                          'image.beforeUpload': function (images) {
                              $scope.froalaOptions.imageUploadParams.uploadId = $scope.folderValue;
                          }
                          ,'file.beforeUpload': function (images) {
                              $scope.froalaOptions.fileUploadParams.uploadId = $scope.folderValue;
                          }
                      }
                  }
              }]
          };
      }])
    .directive('froalaWrapperDoc', ['froalaConfig', function(froalaConfig) {
        return {
            restrict: 'C',
            controller: ['$scope', function ($scope) {
                $scope.froalaOptions = {
                    toolbarInline: false
                    ,attribution: false
                    ,documentReady: true
                    ,imageUploadURL: '/app/storage/froala'
                    ,fileUploadURL: '/app/storage/froala'
                    ,imageUploadParams: {
                        uploadAs: $scope.baseName
                        ,uploadId: $scope.folderValue
                        ,_csrf: $scope.csrf
                    }
                    ,fileUploadParams: {
                        uploadAs: $scope.baseName
                        ,uploadId: $scope.folderValue
                        ,_csrf: $scope.csrf
                    }
                    ,events: {
                        'image.beforeUpload': function (images) {
                            $scope.froalaOptions.imageUploadParams.uploadId = $scope.folderValue;
                        }
                        ,'file.beforeUpload': function (images) {
                            $scope.froalaOptions.fileUploadParams.uploadId = $scope.folderValue;
                        }
                    }
                }
            }]
        };
    }])
    .directive('froalaWrapperSm', ['froalaConfig', function(froalaConfig) {
        return {
            restrict: 'C',
            controller: ['$scope', function ($scope) {
                $scope.froalaOptions = {
                    imageUpload: false
                    ,attribution: false
                    ,theme: 'dark'
                    ,toolbarInline: false
                    ,fileUpload: false
                    ,toolbarButtons: {
                        'moreText': {
                         'buttons': ['bold', 'italic', 'underline', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'inlineClass', 'inlineStyle', 'clearFormatting']
                        },
                        'moreParagraph': {
                         'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote']
                        },
                        'moreRich': {
                         'buttons': ['insertLink', 'insertTable', 'emoticons', 'fontAwesome', 'specialCharacters', 'embedly', 'insertFile', 'insertHR', 'html'],
                         'align': 'right',
                         'buttonsVisible': 2
                        }
                    }
                }
            }]
        };
    }])
})(window, window.angular);
