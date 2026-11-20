import assert from 'node:assert/strict';
import { LiftNetFishing } from '../src/game/LiftNetFishing.js';
import { habitatAt } from '../src/game/Bites.js';

const pierHabitat = habitatAt( { depth: 4, reefDist: 150, pierDist: 1 } );
const dryHabitat = habitatAt( { depth: 0, reefDist: 150, pierDist: 150 } );

{
	const net = new LiftNetFishing( { rng: () => 0.5, lowerSeconds: 1, soakSeconds: 1, raiseSeconds: 1, cooldownSeconds: 1 } );

	assert.equal( net.lower(), true, 'a raised net can be lowered' );
	assert.equal( net.state, 'lowering' );
	assert.equal( net.fraction, 0, 'the net begins raised' );
	assert.equal( net.lower(), false, 'a moving net cannot start another lower cycle' );
	assert.equal( net.update( 0.5 ), null );
	assert.equal( net.fraction, 0.5, 'the net moves down smoothly during lowering' );
	assert.equal( net.update( 0.5 ), null );
	assert.equal( net.state, 'soaking', 'the net waits under water after lowering' );
	assert.equal( net.fraction, 1 );
	assert.equal( net.soakRemaining, 1, 'hauling stays locked for the soak period' );
	assert.equal( net.raise( pierHabitat, 12 ), false, 'the net cannot be hauled before it soaks' );
	assert.equal( net.update( 1 ), null );
	assert.equal( net.raise( pierHabitat, 12 ), true, 'a soaking net can be hauled' );
	assert.equal( net.raise( pierHabitat, 12 ), false, 'one haul cannot be triggered twice' );
	assert.equal( net.update( 0.5 ), null );
	assert.equal( net.fraction, 0.5, 'the net rises smoothly during hauling' );
	const catchResult = net.update( 0.5 );
	assert.ok( catchResult, 'hauling in fishable water can return a catch' );
	assert.ok( catchResult.species, 'the catch uses a known species id' );
	assert.ok( catchResult.kg > 0, 'the catch has a positive weight' );
	assert.equal( net.fraction, 0 );
	assert.equal( net.update( 1 ), null, 'cooldown does not repeat the catch' );
	assert.equal( net.state, 'raised', 'the net resets after cooldown' );
}

{
	const net = new LiftNetFishing( { rng: () => 0.5, lowerSeconds: 1, soakSeconds: 1, raiseSeconds: 1 } );
	net.lower();
	net.update( 1 );
	net.update( 1 );
	assert.equal( net.raise( dryHabitat, 12 ), true );
	assert.equal( net.update( 1 ), null, 'dry ground cannot produce a fish' );
}

console.log( 'Chinese lift net state and catch tests passed.' );
