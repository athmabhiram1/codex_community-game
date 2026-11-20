import assert from 'node:assert/strict';
import { Game } from '../src/game/Game.js';
import { GameState } from '../src/game/GameState.js';
import { LiftNetFishing } from '../src/game/LiftNetFishing.js';
import { Group } from '../src/engine/index.js';
import { ChineseLiftNet } from '../src/world/ChineseLiftNet.js';
import { WORLD } from '../src/world/WorldLayout.js';

let interactionPressed = false;
const station = {
	waterPoint: { x: 72, z: - 35.6 },
	inRange: () => true,
	update() {},
};
const game = Object.create( Game.prototype );
game.app = {
	village: { liftNet: station },
	terrainData: { heightAt: () => - 0.5 },
	tide: { level: 0 },
	settings: { timeOfDay: 12 },
	audio: null,
};
game.state = new GameState( null );
game.liftNetFishing = new LiftNetFishing( { rng: () => 0.5 } );
game.vendors = [];
game._lamp = { level: 0 };
game._pier = WORLD.pier;
game._cardDismissed = false;
game.fight = null;
game.landing = null;
game.hud = null;
game.toast = () => {};

const player = { mode: 'walk', position: { x: 72, z: - 49 }, busy: false, prompt: null };
const input = {
	hit( key ) {

		if ( key !== 'KeyE' ) return false;
		const pressed = interactionPressed;
		interactionPressed = false;
		return pressed;

	},
};
const tick = ( dt ) => game._updateLiftNet( dt, input, player, true );

game.hud = { catchOpen: false, invOpen: true, standOpen: false };
interactionPressed = true;
tick( 0.016 );
assert.equal( game.liftNetFishing.state, 'raised', 'an open inventory blocks lift-net interaction' );
interactionPressed = false;
game.hud = null;

interactionPressed = true;
tick( 0.016 );
assert.equal( game.liftNetFishing.state, 'lowering', 'E lowers the raised net' );
tick( 2 );
assert.equal( game.liftNetFishing.state, 'soaking', 'the lowered net enters its soak phase' );

interactionPressed = true;
tick( 0.016 );
assert.equal( game.liftNetFishing.state, 'soaking', 'the net cannot be hauled before the soak ends' );
tick( 4 );
interactionPressed = true;
tick( 0.016 );
assert.equal( game.liftNetFishing.state, 'raising', 'E starts a haul after soaking' );

interactionPressed = true;
tick( 0.016 );
assert.equal( game.liftNetFishing.state, 'raising', 'repeated E input cannot start another haul' );
tick( 2.3 );
assert.equal( game.liftNetFishing.state, 'cooldown' );
assert.equal( game.state.inventory.length, 1, 'the controller stores the catch through GameState' );
assert.ok( game.state.lastCatch?.species, 'the stored catch is recorded in the fish log' );

tick( 3 );
assert.equal( game.state.inventory.length, 1, 'one lift cycle cannot duplicate a catch' );

const colliderBoxes = [];
const worldRoot = new Group();
const rig = new ChineseLiftNet( {
	terrain: { heightAt: () => 0.3 },
	colliders: { addBox: ( ...args ) => colliderBoxes.push( args ) },
	materials: { wood: {}, hard: {}, stone: {}, net: {} },
	parent: worldRoot,
} );
assert.ok( rig.meshes.some( ( mesh ) => mesh.name === 'ChineseLiftNetMoving_net' ), 'the moving assembly includes the suspended net geometry' );
assert.ok( rig.meshes.find( ( mesh ) => mesh.name === 'ChineseLiftNetMoving_net' ).geometry.getAttribute( 'position' ).count > 0 );
assert.equal( colliderBoxes.length, 1, 'the station adds one compact platform collider' );
assert.equal( colliderBoxes[ 0 ][ 3 ].walkable, true );
assert.equal( rig.inRange( { x: 72, z: - 49 } ), true );
rig.update( 0.5, 0, 'raised' );
const raisedAngle = rig.armGroup.rotation.x;
rig.update( 0.5, 1, 'soaking' );
assert.ok( rig.armGroup.rotation.x > raisedAngle, 'the lever rotates down while lowering the net' );
console.log( 'Game controller lift-net integration passed.' );
