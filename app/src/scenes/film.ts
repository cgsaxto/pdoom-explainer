import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { makeRT, clearRT, W, H } from '../engine/gl';
import { Film } from '../film/core';
import { build } from '../film/build';

export default class FilmScene extends Scene {
  film!: Film;
  rt = makeRT(W, H, { samples: 4 });
  override init() {
    this.film = new Film(this.ctx.lyrics, this.ctx.audio);
    build(this.film);
    this.film.finish();
    for (const s of this.film.surfaces) s.update(0, true);
  }
  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const post: PostOverrides = {};
    this.film.pose(f.t, post, () => {
      const pp = this.film.prepass!;
      clearRT(renderer, pp.rt, [0, 0, 0]);
      renderer.setRenderTarget(pp.rt);
      renderer.render(this.film.world, this.film.cam);
    });
    clearRT(renderer, this.rt, [0, 0, 0]);
    renderer.setRenderTarget(this.rt);
    renderer.render(this.film.world, this.film.cam);
    comp.draw(renderer, this.rt.texture, out, { mode: 'replace', premult: false });
    return post;
  }
}
