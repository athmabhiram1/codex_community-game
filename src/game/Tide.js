// Living tide for Ghosttide Isle: a slow 3-minute sinusoidal sea-level cycle.
//
// Pure per-frame math plus one write to the shared sea-level handle
// (`G.seaLevel`, which lives in the engine's frame uniforms). No allocations
// in update(), no heavy init: construct once in App.init, tick in _frame.
import { G } from '../core/Globals.js';

const TAU = Math.PI * 2;

export class Tide {

	constructor() {

		this.phase = 0; // radians, 0..TAU
		this.period = 180; // s for one full cycle (3 minutes)
		this.amplitude = 0.55; // m either side of baseLevel
		this.baseLevel = 0; // m mean sea level

		this.level = 0; // m above baseLevel right now
		this.normalized = 0; // level / amplitude, -1..1
		this.isRising = true;
		this.isHigh = false; // level > 0.35
		this.isLow = false; // level < -0.35
		this.wreckExposed = false; // level < -0.3
		this.mangroveOpen = false; // level > 0.3
		this.kingTide = false; // level > 0.45
		this.phaseName = 'Rising'; // 'Low tide' | 'Rising' | 'High tide' | 'Falling'

	}

	get isKingTide() {

		return this.kingTide;

	}

	update( dt ) {

		this.phase = ( this.phase + dt * TAU / this.period ) % TAU;
		const level = this.amplitude * Math.sin( this.phase );
		const rising = Math.cos( this.phase ) > 0;
		this.level = level;
		this.normalized = level / this.amplitude;
		this.isRising = rising;
		this.isHigh = level > 0.35;
		this.isLow = level < - 0.35;
		this.wreckExposed = level < - 0.3;
		this.mangroveOpen = level > 0.3;
		this.kingTide = level > 0.45;
		this.phaseName = this.isLow ? 'Low tide' : this.isHigh ? 'High tide' : rising ? 'Rising' : 'Falling';
		G.seaLevel.value = this.baseLevel + level;

	}

}
