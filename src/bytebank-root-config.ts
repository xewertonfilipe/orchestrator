import { addErrorHandler, registerApplication, start } from "single-spa";
import {
  constructApplications,
  constructRoutes,
  constructLayoutEngine,
} from "single-spa-layout";
import "./styles/shell-grid.css";
import microfrontendLayout from "./microfrontend-layout.html";

const SUPPORTED_APPS = new Set([
  "@bytebank/account",
  "@bytebank/authentication",
  "@bytebank/menu",
  "@bytebank/navbar",
  "@bytebank/statement",
  "@bytebank/transaction",
]);

const APP_LABELS: Record<string, string> = {
  "@bytebank/account": "Conta",
  "@bytebank/authentication": "Autenticacao",
  "@bytebank/menu": "Menu",
  "@bytebank/navbar": "Barra superior",
  "@bytebank/statement": "Extrato",
  "@bytebank/transaction": "Transacoes",
};

const FALLBACK_CLASS = "mfe-error-fallback";
const FALLBACK_RETRY_BUTTON_CLASS = "mfe-error-retry";
const FALLBACK_RETRY_STATUS_CLASS = "mfe-error-retry-status";
const FALLBACK_RETRY_LOADING_CLASS = "mfe-error-retry-loading";
const RETRY_DEFAULT_LABEL = "Tentar novamente";
const RETRY_LOADING_LABEL = "Verificando...";
const RETRY_LOADING_MESSAGE = "Verificando disponibilidade...";
const RETRY_UNAVAILABLE_MESSAGE = "Modulo ainda indisponivel.";
const RETRY_AVAILABLE_MESSAGE = "Modulo disponivel. Recarregando...";

type SystemJsLike = {
  resolve: (moduleName: string) => string;
  import: (moduleName: string) => Promise<unknown>;
  delete?: (moduleId: string) => boolean;
};

const isLoadOrMountError = (message: string): boolean => {
  return (
    message.includes("LOADING_SOURCE_CODE") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("MOUNTING")
  );
};

const getAppContainer = (appName: string): HTMLElement | null => {
  const layoutSlot = document.querySelector(`application[name="${appName}"]`);

  if (layoutSlot instanceof HTMLElement) {
    return layoutSlot;
  }

  const runtimeSlot = document.getElementById(
    `single-spa-application:${appName}`
  );

  if (runtimeSlot instanceof HTMLElement) {
    return runtimeSlot;
  }

  return null;
};

const buildFallbackMarkup = (appName: string): string => {
  const appLabel = APP_LABELS[appName] ?? "Modulo";

  return (
    `<div class="${FALLBACK_CLASS}" role="alert">` +
    `<strong>${appLabel} indisponivel.</strong>` +
    `<span>Nao foi possivel carregar este MFE agora.</span>` +
    `<button type="button" class="${FALLBACK_RETRY_BUTTON_CLASS}">Tentar novamente</button>` +
    `<span class="${FALLBACK_RETRY_STATUS_CLASS}" aria-live="polite"></span>` +
    `</div>`
  );
};

const resolveAppUrl = (appName: string): string | null => {
  const runtimeWindow = window as Window & { System?: SystemJsLike };

  if (typeof runtimeWindow.System?.resolve === "function") {
    try {
      return runtimeWindow.System.resolve(appName);
    } catch {
      // Fallback to import-map script resolution below.
    }
  }

  const importMapScripts = Array.from(
    document.querySelectorAll(
      'script[type="injector-importmap"], script[type="importmap"]'
    )
  );

  for (let index = importMapScripts.length - 1; index >= 0; index -= 1) {
    const scriptContent = importMapScripts[index].textContent?.trim();

    if (!scriptContent) {
      continue;
    }

    try {
      const parsed = JSON.parse(scriptContent) as {
        imports?: Record<string, string>;
      };

      const resolvedUrl = parsed.imports?.[appName];

      if (typeof resolvedUrl === "string" && resolvedUrl.length > 0) {
        return resolvedUrl;
      }
    } catch {
      // Ignore invalid maps and continue searching in previous script tags.
    }
  }

  return null;
};

const setRetryLoadingState = (
  button: HTMLButtonElement,
  status: HTMLElement
): void => {
  button.disabled = true;
  button.classList.add(FALLBACK_RETRY_LOADING_CLASS);
  button.setAttribute("aria-busy", "true");
  button.textContent = RETRY_LOADING_LABEL;
  status.textContent = RETRY_LOADING_MESSAGE;
};

const setRetryUnavailableState = (
  button: HTMLButtonElement,
  status: HTMLElement
): void => {
  status.textContent = RETRY_UNAVAILABLE_MESSAGE;
  button.disabled = false;
  button.classList.remove(FALLBACK_RETRY_LOADING_CLASS);
  button.removeAttribute("aria-busy");
  button.textContent = RETRY_DEFAULT_LABEL;
};

const probeModuleAvailability = (appName: string): Promise<boolean> => {
  const runtimeWindow = window as Window & { System?: SystemJsLike };
  const system = runtimeWindow.System;

  const resolvedUrl = resolveAppUrl(appName);

  if (resolvedUrl && typeof system?.delete === "function") {
    try {
      system.delete(resolvedUrl);
    } catch {
      // Ignore cache invalidation errors and still try a fresh import.
    }
  }

  const tryNetworkProbe = (): Promise<boolean> => {
    if (!resolvedUrl) {
      return Promise.resolve(false);
    }

    let probeUrl: URL;

    try {
      probeUrl = new URL(resolvedUrl, window.location.href);
      probeUrl.searchParams.set("__mfe_probe", Date.now().toString());
    } catch {
      return Promise.resolve(false);
    }

    if (typeof fetch !== "function") {
      return Promise.resolve(false);
    }

    return fetch(probeUrl.toString(), {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
    })
      .then(() => true)
      .catch(() => false);
  };

  if (typeof system?.import !== "function") {
    return tryNetworkProbe();
  }

  return system.import(appName).then(
    () => true,
    () => tryNetworkProbe()
  );
};

const attachRetryHandler = (appName: string, target: HTMLElement): void => {
  const button = target.querySelector(`.${FALLBACK_RETRY_BUTTON_CLASS}`);
  const status = target.querySelector(`.${FALLBACK_RETRY_STATUS_CLASS}`);

  if (
    !(button instanceof HTMLButtonElement) ||
    !(status instanceof HTMLElement)
  ) {
    return;
  }

  button.addEventListener("click", () => {
    setRetryLoadingState(button, status);

    probeModuleAvailability(appName)
      .then((isAvailable) => {
        if (!isAvailable) {
          setRetryUnavailableState(button, status);
          return;
        }

        status.textContent = RETRY_AVAILABLE_MESSAGE;
        window.location.reload();
      })
      .catch(() => {
        setRetryUnavailableState(button, status);
      });
  });
};

const renderFallbackForApp = (
  appName: string,
  container?: Element | null
): void => {
  const target =
    container instanceof HTMLElement ? container : getAppContainer(appName);

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.querySelector(`.${FALLBACK_CLASS}`)) {
    return;
  }

  target.innerHTML = buildFallbackMarkup(appName);
  attachRetryHandler(appName, target);
};

const createFallbackLifecycle = (appName: string) => ({
  bootstrap: () => Promise.resolve(),
  mount: (props?: { domElement?: Element | null }) => {
    renderFallbackForApp(appName, props?.domElement);
    return Promise.resolve();
  },
  unmount: () => Promise.resolve(),
});

const routes = constructRoutes(microfrontendLayout);
const applications = constructApplications({
  routes,
  loadApp({ name }: { name: string }) {
    return import(/* webpackIgnore: true */ name).catch((error: unknown) => {
      if (SUPPORTED_APPS.has(name)) {
        return createFallbackLifecycle(name);
      }

      throw error;
    });
  },
});
const layoutEngine = constructLayoutEngine({ routes, applications });

addErrorHandler((error: unknown) => {
  const appName =
    typeof (error as { appOrParcelName?: unknown })?.appOrParcelName ===
    "string"
      ? (error as { appOrParcelName: string }).appOrParcelName
      : "";
  const message =
    typeof (error as { message?: unknown })?.message === "string"
      ? (error as { message: string }).message
      : "";

  if (!SUPPORTED_APPS.has(appName) || !isLoadOrMountError(message)) {
    return;
  }

  renderFallbackForApp(appName);
});

applications.forEach(registerApplication);
layoutEngine.activate();
start();
