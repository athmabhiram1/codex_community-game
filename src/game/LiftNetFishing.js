import { pickSpecies, rollWeight } from './Bites.js';

export const LIFT_NET_STATES = Object.freeze( {
	raised: 'raised',
	lowering: 'lowering',
	soaking: 'soaking',
	raising: 'raising',
	cooldown: 'cooldown',
} );

const DEFAULT_TIMINGS = Object.freeze( {
	lowerSeconds: 1.8,
	soakSeconds: 3.5,
	raiseSeconds: 2.2,
	cooldownSeconds: 2,
} );

export class LiftNetFishing {

	constructor( { rng = Math.random, lowerSeconds = DEFAULT_TIMINGS.lowerSeconds, soakSeconds = DEFAULT_TIMINGS.soakSeconds, raiseSeconds = DEFAULT_TIMINGS.raiseSeconds, cooldownSeconds = DEFAULT_TIMINGS.cooldownSeconds } = {} ) {

		if ( typeof rng !== 'function' ) throw new TypeError( 'LiftNetFishing rng must be a function' );
		this.rng = rng;
		this.lowerSeconds = validateDuration( lowerSeconds, 'lowerSeconds' );
		this.soakSeconds = validateDuration( soakSeconds, 'soakSeconds' );
		this.raiseSeconds = validateDuration( raiseSeconds, 'raiseSeconds' );
		this.cooldownSeconds = validateDuration( cooldownSeconds, 'cooldownSeconds' );
		this.state = LIFT_NET_STATES.raised;
		this.elapsed = 0;
		this.fraction = 0;
		this.pendingCatch = null;

	}

	get soakRemaining() {

		return this.state === LIFT_NET_STATES.soaking ? Math.max( 0, this.soakSeconds - this.elapsed ) : 0;

	}

	lower() {

		if ( this.state !== LIFT_NET_STATES.raised ) return false;
		this.state = LIFT_NET_STATES.lowering;
		this.elapsed = 0;
		this.pendingCatch = null;
		return true;

	}

	raise( habitat, hour, options = {} ) {

		if ( this.state !== LIFT_NET_STATES.soaking || this.elapsed < this.soakSeconds ) return false;
		if ( ! habitat || typeof habitat !== 'object' ) throw new TypeError( 'LiftNetFishing requires a habitat object' );
		const species = pickSpecies( habitat, hour, this.rng, options );
		this.pendingCatch = species ? { species, kg: rollWeight( species, this.rng ) } : null;
		this.state = LIFT_NET_STATES.raising;
		this.elapsed = 0;
		return true;

	}

	update( dt ) {

		if ( ! Number.isFinite( dt ) || dt < 0 ) throw new RangeError( 'LiftNetFishing dt must be a finite non-negative number' );
		if ( dt === 0 ) return null;
		this.elapsed += dt;

		if ( this.state === LIFT_NET_STATES.lowering && this.elapsed >= this.lowerSeconds ) {
			this.state = LIFT_NET_STATES.soaking;
			this.elapsed = 0;
			this.fraction = 1;
		} else if ( this.state === LIFT_NET_STATES.lowering ) {
			this.fraction = this.elapsed / this.lowerSeconds;
		} else if ( this.state === LIFT_NET_STATES.raising && this.elapsed >= this.raiseSeconds ) {
			const caughtFish = this.pendingCatch;
			this.pendingCatch = null;
			this.state = LIFT_NET_STATES.cooldown;
			this.elapsed = 0;
			this.fraction = 0;
			return caughtFish;
		} else if ( this.state === LIFT_NET_STATES.raising ) {
			this.fraction = 1 - this.elapsed / this.raiseSeconds;
		} else if ( this.state === LIFT_NET_STATES.cooldown && this.elapsed >= this.cooldownSeconds ) {
			this.state = LIFT_NET_STATES.raised;
			this.elapsed = 0;
		}

		return null;

	}

}

function validateDuration( duration, name ) {

	if ( ! Number.isFinite( duration ) || duration < 0 ) throw new RangeError( `LiftNetFishing ${ name } must be a finite non-negative number` );
	return duration;

}
