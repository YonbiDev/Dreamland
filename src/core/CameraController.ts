


export class CameraController {
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
     /*   const camera = new BABYLON.FreeCamera("AgeOfEmpiresCamera", new BABYLON.Vector3(0, 100, 50), scene);
        camera.setTarget(new BABYLON.Vector3(50, 50, 50));

        let moveSpeed = 2;
        scene.onBeforeRenderObservable.add(() => {
            let effectiveMoveSpeed = moveSpeed * camera.position.y / 50;
            if (camera.position.y < 10) camera.position.y = 10;
            if (camera.position.y > 100) camera.position.y = 100;
        });

        // Gestion du scrolling aux bords de l'écran
        const edgeScrollSpeed = 0.1;
        scene.onBeforeRenderObservable.add(() => {
            if (scene.pointerX < canvas.width * 0.1) camera.position.x -= edgeScrollSpeed * camera.position.y / 50;
            else if (scene.pointerX > canvas.width * 0.9) camera.position.x += edgeScrollSpeed * camera.position.y / 50;
            if (scene.pointerY < canvas.height * 0.1) camera.position.z += edgeScrollSpeed * camera.position.y / 50;
            else if (scene.pointerY > canvas.height * 0.9) camera.position.z -= edgeScrollSpeed * camera.position.y / 50;
        });

        scene.activeCamera = camera;*/

        const camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2,0, 70, BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);
    }
}
