import * as THREE from "three";
import { mulberry32 } from "../engine/rng";

export function makeFace(seed: number): THREE.Group {
  const rnd = mulberry32(seed);
  const group = new THREE.Group();

  const skinHue = 0.05 + rnd() * 0.06;
  const skin = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(skinHue, 0.45, 0.32 + rnd() * 0.28),
    roughness: 0.75
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), skin);
  head.scale.set(0.88, 1.06, 0.95);
  head.position.y = 0.13;
  group.add(head);

  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf7f7f7 });
  const iris = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(rnd(), 0.55, 0.35)
  });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x111111 });

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), eyeWhite);
    eye.position.set(s * 0.035, 0.16, 0.095);
    group.add(eye);

    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), iris);
    ir.position.set(s * 0.035, 0.16, 0.113);
    group.add(ir);

    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), pupil);
    pu.position.set(s * 0.035, 0.16, 0.121);
    group.add(pu);
  }

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.055, 8), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.125, 0.105);
  group.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.005, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x5a2a2a })
  );
  mouth.position.set(0, 0.085, 0.098);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  const hairMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(rnd() * 0.12 + 0.02, 0.5, 0.08 + rnd() * 0.2)
  });
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.118, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hair.position.y = 0.14;
  hair.scale.set(0.95, 1.05, 0.98);
  group.add(hair);

  return group;
}