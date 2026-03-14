import * as THREE from 'three';

export interface Entity {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  width: number;
  height: number;
  depth: number;
  onGround: boolean;
}

export class Physics {
  static GRAVITY = -0.015;
  static FRICTION = 0.9;

  static checkCollision(a: Entity, b: Entity): boolean {
    return (
      Math.abs(a.position.x - b.position.x) < (a.width + b.width) / 2 &&
      Math.abs(a.position.y - b.position.y) < (a.height + b.height) / 2 &&
      Math.abs(a.position.z - b.position.z) < (a.depth + b.depth) / 2
    );
  }

  static resolveCollision(player: Entity, platform: Entity) {
    const dx = player.position.x - platform.position.x;
    const dy = player.position.y - platform.position.y;
    const dz = player.position.z - platform.position.z;

    const combinedWidth = (player.width + platform.width) / 2;
    const combinedHeight = (player.height + platform.height) / 2;
    const combinedDepth = (player.depth + platform.depth) / 2;

    const overlapX = combinedWidth - Math.abs(dx);
    const overlapY = combinedHeight - Math.abs(dy);
    const overlapZ = combinedDepth - Math.abs(dz);

    if (overlapX < overlapY && overlapX < overlapZ) {
      player.position.x += dx > 0 ? overlapX : -overlapX;
      player.velocity.x = 0;
    } else if (overlapY < overlapX && overlapY < overlapZ) {
      if (dy > 0) {
        player.position.y += overlapY;
        player.velocity.y = 0;
        player.onGround = true;
      } else {
        player.position.y -= overlapY;
        player.velocity.y = 0;
      }
    } else {
      player.position.z += dz > 0 ? overlapZ : -overlapZ;
      player.velocity.z = 0;
    }
  }
}
