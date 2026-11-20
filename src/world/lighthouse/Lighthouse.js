// The lighthouse keeper's ghost light for Ghosttide Isle: a stacked-stone tower on the
// west headland (TIDE.lighthouse), with a gallery, lamp room and a slow-turning beam.
// Procedural only (shared SceneMaterial pipelines, no new shaders, no textures), so no
// new credits are needed beyond the code's MIT licence.
//
//   const lh = new Lighthouse( { scene, terrain, colliders, lights } );
//   lh.update( dt );              // beam rotation + lamp flicker (called from Game)
//   lh.setLamp( 0..1 );           // donation level: brighter, warmer->cyan
//   lh.applyLight( src, level );  // drive a LocalLights source (range 40, wired by Game)
//   lh.shrinePos                 // offering stone at the base (E donates the cheapest fish)
import { Group, Mesh, Vector3, Color } from '../../engine/index.js';
import { BoxGeometry, CylinderGeometry, ConeGeometry } from '../../engine/geometry/index.js';
import { standard } from '../../materials/Materials.js';
import { TIDE } from '../WorldLayout.js';
import { G } from '../../core/Globals.js';

export const LIGHTHOUSE_POS = { x: TIDE.lighthouse.x, z: TIDE.lighthouse.z };
const TOWER_H = 14;

const WARM = new Color( 1.0, 0.72, 0.42 );
const CYAN = new Color( 0.55, 0.95, 1.0 );
const _c = new Color();

export class Lighthouse {

	constructor( { scene, terrain, colliders, lights } = {} ) {

		const x = LIGHTHOUSE_POS.x, z = LIGHTHOUSE_POS.z;
		const gy = terrain ? terrain.heightAt( x, z ) : 0;
		// a wave-cut headland: sit on rock or sand, never floating (foundation skirts below sea level)
		const y0 = Math.max( gy, - 0.5 );
		this.baseY = y0;
		this.position = new Vector3( x, y0, z );
		this.level = 0;
		this._t = Math.random() * 100;

		const stone = standard( { color: 0x8d8578, roughness: 0.95 } );
		const white = standard( { color: 0xe8e2d2, roughness: 0.85 } );
		const red = standard( { color: 0xa63c2e, roughness: 0.8 } );
		const dark = standard( { color: 0x2b2b2e, roughness: 0.6, metalness: 0.4 } );
		this._lampMat = standard( { color: 0x2a2016, roughness: 0.3, emissive: 0xffb45e, emissiveIntensity: 1 } );
		this._beamMat = standard( { color: 0xffe0b0, roughness: 1, transparent: true, opacity: 0.13, depthWrite: false } );

		const g = new Group();
		g.name = 'Lighthouse';
		const add = ( geo, mat, px, py, pz, ry = 0 ) => {

			const m = new Mesh( geo, mat );
			m.position.set( px, py, pz );
			m.rotation.y = ry;
			m.castShadow = true;
			m.receiveShadow = true;
			g.add( m );
			return m;

		};

		// foundation skirt + stacked tapered tower (14 m of whitewashed stone)
		add( new CylinderGeometry( 3.2, 3.7, 1.8, 12 ), stone, x, y0 + 0.9, z );
		add( new CylinderGeometry( 1.55, 2.15, TOWER_H, 14 ), white, x, y0 + 1.8 + TOWER_H / 2, z );
		// two red day-mark bands (slightly proud of the taper)
		const rAt = ( t ) => 2.15 + ( 1.55 - 2.15 ) * t + 0.05;
		add( new CylinderGeometry( rAt( 0.62 ), rAt( 0.5 ), 1.3, 14 ), red, x, y0 + 1.8 + TOWER_H * 0.56, z );
		add( new CylinderGeometry( rAt( 0.3 ), rAt( 0.18 ), 1.3, 14 ), red, x, y0 + 1.8 + TOWER_H * 0.24, z );
		// gallery deck + rail + lamp room + cap
		const topY = y0 + 1.8 + TOWER_H;
		add( new CylinderGeometry( 2.2, 1.8, 0.5, 14 ), dark, x, topY + 0.25, z );
		this._lamp = add( new CylinderGeometry( 1.25, 1.25, 2.0, 12 ), this._lampMat, x, topY + 1.5, z );
		this._lamp.castShadow = false;
		add( new ConeGeometry( 1.7, 1.5, 12 ), red, x, topY + 3.2, z );
		add( new CylinderGeometry( 0.08, 0.08, 1.2, 6 ), dark, x, topY + 4.4, z );
		// door facing the island (+x) + two slit windows
		add( new BoxGeometry( 1.1, 2.0, 0.25 ), dark, x + 2.02, y0 + 2.8, z );
		add( new BoxGeometry( 0.5, 0.9, 0.2 ), dark, x + 1.72, y0 + 7.5, z + 0.4, 0.3 );
		add( new BoxGeometry( 0.5, 0.9, 0.2 ), dark, x + 1.62, y0 + 11.0, z - 0.4, - 0.3 );

		// the rotating beam: a long thin slab pivoting about the lamp (visible mostly at night)
		this._beam = new Group();
		this._beam.position.set( x, topY + 1.5, z );
		const slab = new Mesh( new BoxGeometry( 20, 0.7, 1.6 ), this._beamMat );
		slab.position.x = 10.5;
		slab.castShadow = false;
		slab.receiveShadow = false;
		this._beam.add( slab );
		g.add( this._beam );

		// the offering stone: a flat-topped boulder 4.5 m east of the door, with a shallow bowl
		const sx = x + 5.2, sz = z + 1.5;
		const sy = terrain ? terrain.heightAt( sx, sz ) : y0;
		add( new BoxGeometry( 1.3, 0.9, 1.3 ), stone, sx, sy + 0.45, sz, 0.4 );
		add( new CylinderGeometry( 0.42, 0.3, 0.22, 10 ), dark, sx, sy + 1.0, sz );
		this.shrinePos = new Vector3( sx, sy + 1.1, sz );
		if ( colliders ) {

			colliders.addCylinder( x, z, 2.6, y0, y0 + 2.2 + TOWER_H, { tag: 'lighthouse' } );
			colliders.addBox( this.shrinePos.clone(), new Vector3( 0.65, 0.55, 0.65 ), 0.4, { tag: 'shrine' } );

		}

		// the lamp's world position (a live vector: the LocalLights source follows it)
		this.lampPos = new Vector3( x, topY + 1.5, z );
		if ( scene ) scene.add( g );
		this.group = g;

		// a modest village-style light so the lamp glows at night even before Game wires range 40
		if ( lights ) lights.push( { position: this.lampPos, color: WARM.clone(), intensity: 4, kind: 'lantern', flicker: 0.08 } );

	}

	// donation level 0..1: brighter, and the colour drifts warm -> cyan as the lamp grows
	setLamp( l ) {

		this.level = Math.min( 1, Math.max( 0, l ) );
		_c.copy( WARM ).lerp( CYAN, this.level * 0.85 );
		this._lampMat.emissive.copy( _c );
		this._beamMat.color.copy( _c );

	}

	// drive a LocalLights source (range 40, wired by Game): intensity + colour follow the lamp
	applyLight( src, level = this.level ) {

		if ( ! src ) return;
		_c.copy( WARM ).lerp( CYAN, Math.min( 1, Math.max( 0, level ) ) * 0.85 );
		src.color.copy( _c );
		src.intensity = 2 + 14 * level;

	}

	update( dt = 1 / 60 ) {

		this._t += dt;
		// slow sweep of the beam + a breathing flicker on the lamp glass
		this._beam.rotation.y = this._t * 0.45;
		const flick = 1 + 0.07 * Math.sin( this._t * 9.3 ) * Math.sin( this._t * 5.1 + 1.7 );
		const night = G && G.night ? G.night.value : 1;
		this._lampMat.emissiveIntensity = ( 0.5 + 2.4 * this.level ) * flick * ( 0.25 + 0.75 * Math.max( 0.15, night ) );
		this._beamMat.opacity = ( 0.05 + 0.13 * this.level ) * Math.max( 0.2, night );

	}

}
