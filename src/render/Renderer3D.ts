import * as THREE from "three";
import { MatchEngine } from "../engine/MatchEngine";
import { makeFace } from "./FaceFactory";

const PITCH_W = 105;
const PITCH_H = 68;

export class Renderer3D {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private playerGroups = new Map<string, THREE.Group>();
  private ballMesh: THREE.Mesh;
  private camTarget = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x0b1220);

    this.camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.camera.position.set(0, 40, 70);

    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Pitch
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_W, PITCH_H),
      new THREE.MeshStandardMaterial({ color: 0x1f7a3a })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    // Halfway line + center circle (quick visual reference)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const halfway = new THREE.Mesh(new THREE.PlaneGeometry(0.3, PITCH_H), lineMat);
    halfway.rotation.x = -Math.PI / 2;
    halfway.position.y = 0.01;
    this.scene.add(halfway);

    const circle = new THREE.Mesh(
      new THREE.RingGeometry(9.0, 9.3, 64),
      lineMat
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.01;
    this.scene.add(circle);

    // Ball
    this.ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    this.ballMesh.castShadow = true;
    this.scene.add(this.ballMesh);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /** Build meshes for each player once the engine is created. */
  buildPlayers(engine: MatchEngine) {
    for (const p of engine.players) {
      const team = engine.teams[p.team];
      const g = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 1.35, 12),
        new THREE.MeshStandardMaterial({ color: team.colors.primary })
      );
      body.position.y = 0.9;
      body.castShadow = true;
      g.add(body);

      const shorts = new THREE.Mesh(
        new THREE.CylinderGeometry(0.30, 0.34, 0.45, 12),
        new THREE.MeshStandardMaterial({ color: team.colors.secondary })
      );
      shorts.position.y = 0.3;
      g.add(shorts);

      const face = makeFace(p.seed.seed);
      face.position.y = 1.95;
      g.add(face);

      this.scene.add(g);
      this.playerGroups.set(p.seed.id, g);
    }
  }

  /** Called every frame: copy engine state to meshes. */
  sync(engine: MatchEngine) {
    for (const p of engine.players) {
      const g = this.playerGroups.get(p.seed.id);
      if (!g) continue;
      g.position.set(p.pos.x - PITCH_W / 2, 0, p.pos.y - PITCH_H / 2);
      const facing = Math.atan2(p.vel.x, p.vel.y);
      g.rotation.y = facing;
    }

    const b = engine.ball;
    this.ballMesh.position.set(
      b.pos.x - PITCH_W / 2,
      Math.max(0.22, b.pos.z),
      b.pos.y - PITCH_H / 2
    );

    // Simple chase camera
    this.camTarget.set(
      b.pos.x - PITCH_W / 2,
      0,
      b.pos.y - PITCH_H / 2
    );
    const desired = new THREE.Vector3(
      this.camTarget.x * 0.4,
      38,
      this.camTarget.z * 0.4 + 55
    );
    this.camera.position.lerp(desired, 0.03);
    this.camera.lookAt(this.camTarget);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}