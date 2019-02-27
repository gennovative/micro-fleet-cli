import { registerIdAddOn, Types as IT, IdProviderAddOn } from '@micro-fleet/id-generator';
import { MicroServiceBase } from '@micro-fleet/microservice';
import { registerDbAddOn } from '@micro-fleet/persistence';
import { AuthAddOn, ErrorHandlerFilter, registerWebAddOn, Types as WT } from '@micro-fleet/web';


class RestAPIService extends MicroServiceBase {

	/**
	 * @override
	 */
	protected registerDependencies(): void {
		super.registerDependencies();
	}


	/**
	 * @override
	 */
	protected onStarting(): void {
		super.onStarting();

		// IMPORTANT - Default is `false`
		this._configProvider.enableRemote = false;
		this.attachAddOn(registerIdAddOn());
		this.attachAddOn(registerDbAddOn());
		
		const webAddOn = registerWebAddOn();
		webAddOn.addGlobalErrorHandler(ErrorHandlerFilter);
		this.attachAddOn(webAddOn);

		// TODO: Should have registerAuthAddOn
		const authAddon = this._depContainer.resolve<AuthAddOn>(WT.AUTH_ADDON);
		this.attachAddOn(authAddon);
	}

	/**
	 * @override
	 */
	protected onError(error: any): void {
		super.onError(error);
	}

}

new RestAPIService().start();
