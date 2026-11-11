// Patch port: the render scale for slower computers, and the Performance settings kept between visits.
//
// The scale the game starts at, first that applies:
//   ?scale=<0.5..1> in the URL (testing).
//   Patch's performance mode (the frame is named `patch:quality=<level>`): window.patch.quality caps it,
//   high 100%, medium 75%, low 50%, and a 'qualitychange' lowers it while the game plays. A Render scale
//   the player picked by hand can go lower still. Patch measures and lowers the level itself there, so the
//   step-down below stays off.
//   The player's own Render scale (Settings > Performance), saved.
//   The step-down: once loaded, a median under 40 fps over 5 s lowers it 100% -> 75% -> 50%, saved. It
//   stops for good once the player picks a Render scale by hand.
// Shadows and Water reflections are saved when the player changes them.
const KEY = 'tidewater.quality';
const STEPS = [ 1, 0.75, 0.5 ];
const LEVEL_SCALE = { high: 1, medium: 0.75, low: 0.5 };
const SLOW_FPS = 40;
const WINDOW = 5; // seconds of frames per measurement
const SETTLE = 3; // seconds skipped after loading and after each step (the targets are rebuilt)
const FAST_WINDOWS = 3; // measurements at or above SLOW_FPS that end the step-down for this visit

export class Quality {

	constructor( app ) {

		this.app = app;
		this.saved = load();
		const named = typeof window !== 'undefined' && /^patch:quality=(low|medium|high)$/.test( String( window.name || '' ) );
		const patch = typeof window !== 'undefined' ? window.patch : null;
		this.patch = named && patch && typeof patch.quality === 'string' ? patch : null;
		this.urlScale = app.qs.has( 'scale' ) ? Number( app.qs.get( 'scale' ) ) || 1 : null;
		this.auto = ! this.patch && this.urlScale === null && ! this.saved.manual;
		this._running = false;
		this._frames = [];
		this._t = 0;
		this._fast = 0;

	}

	// the render scale to start at
	initialScale() {

		if ( this.urlScale !== null ) return this.urlScale;
		const own = this.saved.manual ? this.saved.renderScale ?? 1 : 1;
		if ( this.patch ) return Math.min( LEVEL_SCALE[ this.patch.quality ] ?? 1, own );
		if ( this.saved.manual ) return own;
		return STEPS.includes( this.saved.auto ) ? this.saved.auto : 1;

	}

	// shadows and water reflections as the player left them, and Patch lowering the level live
	apply() {

		const app = this.app;
		if ( this.saved.shadows === false ) app.shadows.enabled = false;
		if ( this.saved.ssr === false ) app.waterMaterial.params.ssr.value = 0;
		if ( this.patch ) this.patch.addEventListener( 'qualitychange', () => {

			const cap = LEVEL_SCALE[ this.patch.quality ] ?? 1;
			if ( app.settings.renderScale > cap ) app.setRenderScale( cap );

		} );

	}

	// the frame loop runs from here on: the step-down starts measuring
	start() {

		this._running = this.auto && this.app.settings.renderScale > STEPS[ STEPS.length - 1 ];
		this._t = - SETTLE;

	}

	// a choice made in Settings > Performance (renderScale, shadows or ssr)
	choose( key, value ) {

		this.saved[ key ] = value;
		if ( key === 'renderScale' ) {

			this.saved.manual = true;
			this.auto = false;
			this._running = false;

		}

		save( this.saved );

	}

	update( dt ) {

		if ( ! this._running ) return;
		if ( typeof document !== 'undefined' && document.visibilityState === 'hidden' ) {

			this._t = - SETTLE;
			this._frames.length = 0;
			return;

		}

		this._t += dt;
		if ( this._t <= 0 ) return;
		this._frames.push( dt );
		if ( this._t < WINDOW ) return;
		const f = this._frames.sort( ( a, b ) => a - b );
		const fps = 1 / f[ f.length >> 1 ];
		this._frames.length = 0;
		this._t = 0;
		if ( fps >= SLOW_FPS ) {

			if ( ++ this._fast >= FAST_WINDOWS ) this._running = false;
			return;

		}

		this._fast = 0;
		const now = this.app.settings.renderScale;
		const next = STEPS.find( ( s ) => s < now - 0.001 );
		if ( next === undefined ) {

			this._running = false;
			return;

		}

		this.app.setRenderScale( next );
		this.saved.auto = next;
		save( this.saved );
		this._t = - SETTLE;
		if ( next === STEPS[ STEPS.length - 1 ] ) this._running = false;

	}

}

function load() {

	try {

		const v = JSON.parse( localStorage.getItem( KEY ) || '{}' );
		return v && typeof v === 'object' ? v : {};

	} catch {

		return {};

	}

}

function save( v ) {

	try {

		localStorage.setItem( KEY, JSON.stringify( v ) );

	} catch {

		// storage can be missing or full: the choice lasts this visit only

	}

}
