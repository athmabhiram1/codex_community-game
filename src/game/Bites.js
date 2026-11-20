import { FISH, FISH_IDS } from './FishTable.js';

// Where the bobber is and what lives there.
//   depth     water depth under the bobber (m)
//   reefDist  horizontal distance to the reef edge (m, < 0 inside it)
//   pierDist  horizontal distance to the pier (piles / head) (m)
//   opts (optional, 2nd arg): { tideLevel, wreckDist, mangroveDist, storm }
//     tideLevel < -0.3 near the wreck boosts reef; tideLevel > 0.3 near the
//     mangroves boosts shallows. Old 3-field calls still work.
// Returns weights per water type (they overlap: a spot can be both pier and bay).
export function habitatAt( { depth, reefDist, pierDist, tide, tideLevel, wreckDist, mangroveDist, storm }, opts = {} ) {

	const o = opts || {};
	const tl = o.tideLevel ?? tideLevel ?? tide ?? 0;
	const wd = o.wreckDist ?? wreckDist ?? 999;
	const md = o.mangroveDist ?? mangroveDist ?? 999;
	const h = { shallows: 0, reef: 0, pier: 0, bay: 0, deep: 0 };
	if ( depth < 0.25 ) return h; // on the sand
	h.shallows = smooth( 3.5, 1.0, depth );
	h.reef = smooth( 12, - 6, reefDist ) * smooth( 0.8, 2.5, depth );
	h.pier = smooth( 9, 2, pierDist ) * smooth( 0.6, 2, depth );
	h.bay = smooth( 1.5, 4, depth ) * ( 1 - smooth( 18, 30, depth ) );
	h.deep = smooth( 16, 28, depth );
	// Ghosttide Isle: tide-gated bonuses (wreck exposes at low tide, mangroves flood at high)
	h.reef += ( tl < - 0.3 && wd < 25 ? 1.2 : 0 );
	h.shallows += ( tl > 0.3 && md < 25 ? 1.0 : 0 );
	return h;

}

// 1 at the species' favourite time, less at others; hour 0..24
export function activity( pref, hour ) {

	const dawn = Math.exp( - ( ( hour - 6.5 ) ** 2 ) / 2.5 ), dusk = Math.exp( - ( ( hour - 18.5 ) ** 2 ) / 2.5 );
	const night = hour < 5.5 || hour > 19.5 ? 1 : 0;
	const day = hour > 7 && hour < 18 ? 1 : 0.35;
	switch ( pref ) {

		case 'day': return 0.25 + 0.75 * day * ( 1 - night );
		case 'dawnDusk': return 0.3 + 0.7 * Math.max( dawn, dusk ) + 0.1 * day;
		case 'night': return 0.15 + 0.85 * Math.max( night, dusk * 0.8 );
		default: return 0.8 + 0.2 * Math.max( dawn, dusk );

	}

}

// Weighted pick of the species that bites here; null when nothing lives here.
// rng: () => [0, 1)
// opts: { storm (0..1), lamp (0..1 boat light), tideLevel } — the legendary
//   ghosttide only bites at night with storm or lamp light on a high tide;
//   otherwise its weight is zeroed. Old 3-arg calls still work.
export function pickSpecies( habitat, hour, rng = Math.random, opts = {} ) {

	let storm = 0, lamp = 0, tideLevel = 0;
	if ( typeof opts === 'number' ) storm = opts;
	else if ( opts ) {

		storm = opts.storm ?? 0;
		lamp = opts.lamp ?? opts.light ?? 0;
		tideLevel = opts.tideLevel ?? opts.tide ?? 0;

	}
	let total = 0;
	const w = [];
	for ( const id of FISH_IDS ) {

		const f = FISH[ id ];
		let hw = 0;
		for ( const k in f.habitat ) hw += f.habitat[ k ] * habitat[ k ];
		const x = hw * f.rarity * activity( f.time, hour );
		w.push( x );
		total += x;

	}

	// Ghosttide Isle: legendary gating for ghosttide
	const gi = FISH_IDS.indexOf( 'ghosttide' );
	if ( gi >= 0 ) {

		const isNight = hour < 5.5 || hour > 19.5;
		const gated = isNight && ( storm > 0.7 || lamp > 0.5 ) && tideLevel > 0.35;
		if ( ! gated ) {

			total -= w[ gi ];
			w[ gi ] = 0;

		} else {

			const boost = 1 + storm * 2 + lamp * 2;
			total += w[ gi ] * ( boost - 1 );
			w[ gi ] *= boost;

		}

	}

	if ( total < 1e-4 ) return null;
	let r = rng() * total;
	for ( let i = 0; i < w.length; i ++ ) {

		r -= w[ i ];
		if ( r <= 0 ) return FISH_IDS[ i ];

	}

	return FISH_IDS[ FISH_IDS.length - 1 ];

}

// Weight in kg: skewed toward the small end (most fish are small, trophies are rare)
export function rollWeight( id, rng = Math.random ) {

	const [ a, b ] = FISH[ id ].kg;
	const t = Math.pow( rng(), 2.2 );
	return a + ( b - a ) * t;

}

// Seconds until the next bite at this spot: richer water bites sooner. Infinity when barren.
// storm (4th arg, number or { storm }): a high storm bites slightly faster (mean * 0.85).
export function biteDelay( habitat, hour, rng = Math.random, stormOrOpts = 0 ) {

	let storm = 0;
	let r = rng;
	if ( typeof r !== 'function' ) {

		if ( typeof r === 'object' && r !== null ) storm = r.storm ?? 0;
		else if ( typeof r === 'number' ) storm = r;
		r = Math.random;

	} else if ( typeof stormOrOpts === 'number' ) storm = stormOrOpts;
	else if ( stormOrOpts ) storm = stormOrOpts.storm ?? 0;
	let rich = 0;
	for ( const k in habitat ) rich += habitat[ k ];
	if ( rich < 0.05 ) return Infinity;
	// open water between the named habitats still has fish: never much slower than a poor spot
	rich = Math.max( rich, 0.35 );
	const light = hour > 6 && hour < 19 ? 1 : 0.8;
	let mean = 8 / ( Math.min( rich, 1.6 ) * light );
	if ( storm > 0.7 ) mean *= 0.85;
	return 2 + - Math.log( 1 - r() * 0.98 ) * mean * 0.6;

}

function smooth( e0, e1, x ) {

	const t = Math.min( 1, Math.max( 0, ( x - e0 ) / ( e1 - e0 ) ) );
	return t * t * ( 3 - 2 * t );

}
