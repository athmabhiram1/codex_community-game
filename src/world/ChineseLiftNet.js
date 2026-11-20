import { Group, Mesh, Vector3 } from '../engine/index.js';
import { Batch, Builder, gridPart } from './village/GeoBuilder.js';

export const CHINESE_LIFT_NET_POSITION = Object.freeze( { x: 72, z: - 49 } );

const PLATFORM = Object.freeze( { width: 4.4, depth: 3.4 } );
const ARM = Object.freeze( { pivotHeight: 4.9, tipZ: 15.1, netCenterZ: 13.4 } );
const TINT = Object.freeze( {
	wood: [ 0.48, 0.32, 0.19 ],
	weatheredWood: [ 0.29, 0.25, 0.20 ],
	rope: [ 0.58, 0.50, 0.37 ],
	stone: [ 0.40, 0.38, 0.34 ],
	net: [ 0.79, 0.75, 0.64 ],
} );

export class ChineseLiftNet {

	constructor( { terrain, colliders, materials, parent } ) {

		if ( ! terrain || ! colliders || ! materials || ! parent ) throw new TypeError( 'ChineseLiftNet requires terrain, colliders, materials, and parent' );
		const { x, z } = CHINESE_LIFT_NET_POSITION;
		this.position = new Vector3( x, terrain.heightAt( x, z ), z );
		this.waterPoint = new Vector3( x, 0, z + ARM.netCenterZ );
		this.interactionRadius = 4.8;
		this.group = new Group();
		this.group.name = 'ChineseLiftNet';
		this.group.position.copy( this.position );
		this.armGroup = new Group();
		this.armGroup.name = 'ChineseLiftNetMovingArm';
		this.armGroup.position.set( 0, ARM.pivotHeight, 0 );
		this.group.add( this.armGroup );
		this.meshes = [];
		this.elapsed = 0;

		this._buildPlatform( materials );
		this._buildFrame( materials );
		this._buildArm( materials );
		parent.add( this.group );

		colliders.addBox(
			new Vector3( x, this.position.y + 0.12, z ),
			new Vector3( PLATFORM.width / 2, 0.12, PLATFORM.depth / 2 ),
			0,
			{ walkable: true, solid: false, tag: 'liftNetPlatform' },
		);

	}

	inRange( point ) {

		if ( ! point ) return false;
		return Math.hypot( point.x - this.position.x, point.z - this.position.z ) <= this.interactionRadius;

	}

	update( dt, fraction, state ) {

		this.elapsed += Math.max( 0, dt );
		const progress = Math.min( 1, Math.max( 0, fraction ) );
		this.armGroup.rotation.x = - 0.08 + progress * 0.34;
		this.armGroup.rotation.z = state === 'soaking' ? Math.sin( this.elapsed * 1.7 ) * 0.008 : 0;

	}

	_buildPlatform( materials ) {

		const builder = new Builder();
		builder.box( 'wood', 0, 0.1, 0, PLATFORM.width, 0.2, PLATFORM.depth, { tint: TINT.weatheredWood, grain: 0 } );
		for ( const x of [ - 1.8, 1.8 ] ) for ( const z of [ - 1.25, 1.25 ] ) {

			builder.cyl( 'wood', x, - 0.05, z, 0.12, 0.15, 0.55, { tint: TINT.weatheredWood, segs: 7 } );

		}

		this._attachMeshes( builder, materials, this.group, 'ChineseLiftNetPlatform' );

	}

	_buildFrame( materials ) {

		const builder = new Builder();
		const baseY = 0.22;
		const pivotY = ARM.pivotHeight;
		for ( const x of [ - 1.35, 1.35 ] ) {

			builder.rod( 'wood', [ x, baseY, - 0.95 ], [ x * 0.84, pivotY, 0.25 ], 0.16, 0.13, { tint: TINT.wood, segs: 8 } );
			builder.rod( 'wood', [ x, baseY, 1.05 ], [ x * 0.84, pivotY - 0.15, 0.25 ], 0.15, 0.12, { tint: TINT.weatheredWood, segs: 8 } );

		}

		builder.rod( 'wood', [ - 1.65, pivotY - 0.08, 0.2 ], [ 1.65, pivotY - 0.08, 0.2 ], 0.18, 0.18, { tint: TINT.wood, segs: 8 } );
		builder.rod( 'wood', [ - 1.65, pivotY + 0.18, 0.2 ], [ 1.65, pivotY + 0.18, 0.2 ], 0.12, 0.12, { tint: TINT.weatheredWood, segs: 8 } );
		builder.rod( 'wood', [ - 1.25, 3.2, - 0.95 ], [ 1.25, 3.2, - 0.95 ], 0.09, 0.09, { tint: TINT.weatheredWood, segs: 7 } );

		for ( const x of [ - 1.35, 1.35 ] ) {

			builder.rod( 'rope', [ x, 0.6, - 1.0 ], [ x * 0.84, pivotY + 0.22, 0.2 ], 0.055, 0.055, { tint: TINT.rope, data: [ 0.3 ], segs: 6 } );
			builder.rod( 'wood', [ x, 0.18, 1.05 ], [ x, 1.1, 1.05 ], 0.045, 0.045, { tint: TINT.weatheredWood, segs: 6 } );

		}

		this._attachMeshes( builder, materials, this.group, 'ChineseLiftNetFrame' );

	}

	_buildArm( materials ) {

		const builder = new Builder();
		const endZ = ARM.tipZ;
		for ( const x of [ - 0.78, 0.78 ] ) {

			builder.rod( 'wood', [ x, 0, - 3.8 ], [ x, 0, endZ ], 0.17, 0.12, { tint: TINT.wood, segs: 8 } );

		}

		for ( const z of [ - 3.2, - 1.0, 0.9, 4.2, 7.4, 10.6, 13.5, 14.8 ] ) {

			builder.rod( 'wood', [ - 0.9, 0, z ], [ 0.9, 0, z ], z < 1 ? 0.1 : 0.075, z < 1 ? 0.1 : 0.075, { tint: TINT.weatheredWood, segs: 7 } );

		}

		// The short rear arm and stone load balance the long bamboo cantilever.
		builder.rod( 'wood', [ 0, 0, - 0.4 ], [ 0, 0.2, - 3.6 ], 0.16, 0.11, { tint: TINT.weatheredWood, segs: 8 } );
		builder.box( 'wood', 0, - 0.3, - 3.25, 1.5, 0.18, 1.2, { tint: TINT.weatheredWood } );
		builder.box( 'stone', - 0.38, 0, - 3.3, 0.52, 0.48, 0.46, { tint: TINT.stone, rx: 0.1, rz: - 0.08 } );
		builder.box( 'stone', 0.3, 0.04, - 3.5, 0.6, 0.56, 0.52, { tint: [ 0.46, 0.43, 0.38 ], ry: 0.3, rz: 0.12 } );
		builder.box( 'stone', 0.02, 0.34, - 3.2, 0.42, 0.32, 0.4, { tint: [ 0.35, 0.34, 0.32 ], rx: - 0.1, ry: - 0.2 } );

		this._addNetAndRopes( builder );
		this._attachMeshes( builder, materials, this.armGroup, 'ChineseLiftNetMoving' );

	}

	_addNetAndRopes( builder ) {

		const corners = [
			[ - 2.15, - 1.82, 11.7 ], [ 2.15, - 1.82, 11.7 ],
			[ - 2.15, - 1.82, 15.0 ], [ 2.15, - 1.82, 15.0 ],
		];
		for ( const [ index, corner ] of corners.entries() ) {

			const armSide = index % 2 === 0 ? - 0.72 : 0.72;
			builder.rod( 'rope', [ armSide, - 0.08, ARM.netCenterZ ], corner, 0.04, 0.035, { tint: TINT.rope, data: [ 0.6 ], segs: 6 } );

		}

		const width = 4.3, depth = 3.3, startZ = 11.7, drop = 1.82;
		const net = gridPart( 14, 12, ( i, j ) => {

			const u = i / 14, v = j / 12;
			const x = ( u - 0.5 ) * width;
			const z = startZ + v * depth;
			const sag = 0.3 * Math.sin( Math.PI * u ) * Math.sin( Math.PI * v );
			return { p: [ x, - drop - sag, z ], n: [ 0, 1, 0 ], uv: [ x, z * 0.62 ] };

		} );
		builder.add( 'net', net, builder.frame, TINT.net, ( x, y ) => [ 0.62, Math.min( 1, Math.max( 0, ( - y ) / ( drop + 0.3 ) ) ) * 0.7, 0.045, 0 ] );

		for ( const z of [ startZ, startZ + depth ] ) builder.rod( 'rope', [ - width / 2, - drop, z ], [ width / 2, - drop, z ], 0.05, 0.05, { tint: TINT.rope, data: [ 0.4 ], segs: 6 } );
		for ( const x of [ - width / 2, width / 2 ] ) builder.rod( 'rope', [ x, - drop, startZ ], [ x, - drop, startZ + depth ], 0.05, 0.05, { tint: TINT.rope, data: [ 0.4 ], segs: 6 } );

	}

	_attachMeshes( builder, materials, parent, name ) {

		for ( const key of [ 'wood', 'stone', 'hard', 'net' ] ) {

			const batch = builder.batches[ key ];
			if ( batch && batch.vcount > 0 ) this._attachMesh( batch.build(), materials[ key ], parent, `${ name }_${ key }` );

		}

		const ropeBatch = builder.batches.rope;
		if ( ropeBatch && ropeBatch.vcount > 0 ) {

			const hardBatch = new Batch();
			hardBatch.append( ropeBatch, ( data ) => [ data[ 0 ], 0, 0, 2 + data[ 1 ] ] );
			this._attachMesh( hardBatch.build(), materials.hard, parent, `${ name }_rope` );

		}

	}

	_attachMesh( geometry, material, parent, name ) {

		const mesh = new Mesh( geometry, material );
		mesh.name = name;
		mesh.receiveShadow = true;
		mesh.castShadow = false;
		parent.add( mesh );
		this.meshes.push( mesh );

	}

}
