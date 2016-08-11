/**
 * Created by Primoz on 26. 07. 2016.
 */
var volumeLoadingController = function($scope, TaskManagerService) {

    TaskManagerService.addResultCallback("MarchingCubes", function (mhdMeta, values, isoValue) {
        var runnable = function (onLoad, onProgress, onError) {
            var nThreads = 8;

            var privateOnLoad = function(data) {
                var group = new M3D.Group();

                // Form mesh objects
                for (var i = 0; i < data.length; i++) {
                    var bufferGeometry = new M3D.Geometry();
                    bufferGeometry.vertices = new M3D.BufferAttribute(data[i], 3);
                    bufferGeometry.computeVertexNormals();

                    var mesh = new M3D.Mesh(bufferGeometry, new M3D.MeshPhongMaterial());
                    mesh.material = new M3D.MeshPhongMaterial();
                    mesh.material.specular = new THREE.Color("#777777");
                    mesh.material.color = new THREE.Color("#FF0000");
                    mesh.scale = new THREE.Vector3(100, 100, 100);

                    group.add(mesh);
                }

                // Pass group to onLoad callback
                onLoad(group);
            };

            var privateOnError = function(errorMsg) {
                onError({code: 1, msg: errorMsg});
            };

            var dim = mhdMeta.dimensions;
            var voxelDim = mhdMeta.elementSpacing;

            // Start execution
            MC.extractMesh({dimensions: {x: dim[0], y: dim[1], z: dim[2]}, voxelDimensions: {x: voxelDim[0], y: voxelDim[1], z: voxelDim[2]}, isoLevel: isoValue}, values, nThreads, privateOnLoad, onProgress, privateOnError);
        };

        var task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Marching cubes",
                description: "Executing Marching cubes algorithm on the selected volume.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "MHDLoader",
            run: runnable,
            cancel: function () {/* TODO */}
        };


        TaskManagerService.enqueueNewTask(task);
    });

    $scope.localMhdLoad = function (mhdFile, rawFile, isoValue) {

        var runnable = function (onLoad, onProgress, onError) {
            var nThreads = 8;

            var privateOnLoad = function(data) {
                var group = new M3D.Group();

                // Form mesh objects
                for (var i = 0; i < data.length; i++) {
                    var bufferGeometry = new M3D.Geometry();
                    bufferGeometry.vertices = new M3D.BufferAttribute(data[i], 3);
                    bufferGeometry.computeVertexNormals();

                    var mesh = new M3D.Mesh(bufferGeometry, new M3D.MeshPhongMaterial());
                    mesh.material = new M3D.MeshPhongMaterial();
                    mesh.material.specular = new THREE.Color("#777777");
                    mesh.material.color = new THREE.Color("#FF0000");
                    mesh.scale = new THREE.Vector3(100, 100, 100);

                    group.add(mesh);
                }

                // Pass group to onLoad callback
                onLoad(group);
            };

            var privateOnError = function(errorMsg) {
                onError({code: 1, msg: errorMsg});
            };

            // Read the volume
            var reader = new M3D.MHDReader(function(rez) {
                if (rez.status.code !== 0) {
                    onError({code: 2, msg: "MHD volume reading failed with code " + rez.status.code + ". " + rez.status.msg});
                    return;
                }

                var dim = rez.meta.dimensions;
                var voxelDim = rez.meta.elementSpacing;

                // Start execution
                MC.extractMesh({dimensions: {x: dim[0], y: dim[1], z: dim[2]}, voxelDimensions: {x: voxelDim[0], y: voxelDim[1], z: voxelDim[2]}, isoLevel: isoValue}, rez.data, nThreads, privateOnLoad, onProgress, privateOnError);
            });

            reader.fileLoad(mhdFile, rawFile);
        };

        var task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Marching cubes",
                description: "Executing Marching cubes algorithm on the selected volume.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "MHDLoader",
            run: runnable,
            cancel: function () {/* TODO */}
        };


        TaskManagerService.enqueueNewTask(task);
    };

    $scope.serverMhdLoad = function (filename, isoValue) {
        var runnable = function (onLoad, onProgress, onError) {
            // Init .obj loader
            var objLoader = new M3D.ObjLoader();

            $.ajax({
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function (event) {
                        if (event.lengthComputable) {
                            // Track downloading progress
                            onProgress(event.loaded / event.total * 100);
                        }
                    }, false);

                    xhr.addEventListener("progress", function (event) {
                        if (event.lengthComputable) {
                            // Track downloading progress
                            onProgress(event.loaded / event.total * 100);
                        }
                    }, false);

                    return xhr;
                },
                type: "POST",
                url: '/api/file-management',
                data: JSON.stringify({reqType: "mhdVolume", filename: filename}),
                contentType: "application/json",
                error: function (request) {
                    onError({code: 1, msg: request.responseText});
                },
                success: function (res) {
                    if (res.status === 0) {

                        var reader = new M3D.MHDReader(function(rez) {
                            if (rez.status.code !== 0) {
                                onError({code: 2, msg: "MHD volume reading failed with code " + rez.status.code + ". " + rez.status.msg});
                                return;
                            }

                            onLoad(rez.meta, rez.data, isoValue);
                        });

                        reader.dataParse(res.data.mhd, res.data.raw);
                    }
                    else {
                        onError({code: res.status, msg: res.errMsg})
                    }
                }
            });
        };

        var task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Downloading MHD volume",
                description: "Downloading selected MHD volume from the server.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "MarchingCubes",
            run: runnable,
            cancel: function () {/* TODO */
            }
        };

        TaskManagerService.enqueueNewTask(task);
    }
};

app.controller('VolumeLoadingController', volumeLoadingController);