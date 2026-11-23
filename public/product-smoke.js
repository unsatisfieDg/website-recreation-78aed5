const startWindow = 300;
const revealEnd = 2.19;
const stallWindow = 1100;
const maxFrameStep = .11;

function easeBetween(from, to, time) {
  const amount = Math.min(1, Math.max(0, (time - from) / (to - from)));
  return amount * amount * (3 - 2 * amount);
}

export function productSmokeFrame(time, gatherPair = false) {
  const dim = easeBetween(.015, .28, time);
  const clear = easeBetween(1.48, revealEnd, time);
  return {
    veil: dim * (1 - clear),
    density: easeBetween(.01, .18, time) * (1 - easeBetween(1.34, 2.10, time)),
    pigment: easeBetween(.20, 1.02, time),
    subject: 1 - dim + easeBetween(.82, 1.27, time),
    framing: easeBetween(.28, .78, time) * (1 - easeBetween(1.44, revealEnd, time)),
    gather: gatherPair ? easeBetween(.28, .78, time) * (1 - easeBetween(1.54, 2.16, time)) : 0,
    mark: easeBetween(.89, 1.22, time) * (1 - easeBetween(1.65, 2.10, time)),
    copy: 1 - dim + clear
  };
}

export function createProductSmoke(host, scope, { allowed, invalidate = () => {} }) {
  const enabled = new URLSearchParams(location.search).get('smoke') !== 'off';
  let field, plume, video, mark, current, frame = null, request = 0, failed = false;

  const canPlay = () => enabled && !failed && !scope.disposed && !document.hidden &&
    !navigator.connection?.saveData && allowed();

  function stop(complete) {
    if (!current) return;
    const done = current.done;
    current = null;
    cancelAnimationFrame(request);
    request = 0;
    video.pause();
    if (frame) {
      frame = null;
      field.hidden = mark.hidden = true;
      delete host.dataset.productSmoke;
      host.removeAttribute('data-product-smoke-covered');
      host.style.removeProperty('--product-smoke-copy');
      host.style.removeProperty('--product-smoke-subject');
    }
    invalidate();
    if (complete) done?.();
  }

  function prepare() {
    if (!canPlay()) return false;
    if (video) return true;

    field = document.createElement('div');
    field.className = 'product-smoke';
    field.hidden = true;
    field.setAttribute('aria-hidden', 'true');
    plume = document.createElement('div');
    plume.className = 'product-smoke__plume';
    video = document.createElement('video');
    video.muted = video.defaultMuted = video.playsInline = true;
    video.disablePictureInPicture = video.disableRemotePlayback = true;
    video.preload = 'auto';
    video.tabIndex = -1;
    scope.on(video, 'error', () => {
      failed = true;
      stop(true);
    });
    video.src = new URL('./assets/product-smoke.mp4', import.meta.url).href;
    plume.append(video);
    field.append(plume);

    mark = document.createElement('img');
    mark.className = 'product-smoke__mark';
    mark.hidden = true;
    mark.alt = '';
    mark.width = 320;
    mark.height = 282;
    mark.decoding = 'async';
    mark.src = new URL('./assets/product-smoke-logo.webp', import.meta.url).href;
    host.append(field, mark);
    return true;
  }

  function update(now) {
    request = 0;
    if (!current) return;
    const mediaTime = video.ended ? revealEnd : video.currentTime;
    const ready = video.readyState >= 2 && (!video.paused || video.ended) &&
      !video.seeking && mediaTime > 0;
    if (ready && mediaTime > current.lastMediaTime) {
      current.lastMediaTime = mediaTime;
      current.lastMediaFrame = now;
    }
    if (!canPlay() || (!frame && !ready && now - current.started >= startWindow) ||
        (frame && !video.ended && now - current.lastMediaFrame >= stallWindow)) {
      stop(true);
      return;
    }
    // The video leads the cue, but a dropped frame cannot skip the brand and product beat.
    const step = Math.min(maxFrameStep, Math.max(0, now - current.lastFrame) / 700);
    current.lastFrame = now;
    const time = Math.min(mediaTime, current.time + step);
    if (ready && time >= revealEnd) {
      stop(true);
      return;
    }
    if (ready && time > current.time) {
      if (!frame) {
        field.hidden = mark.hidden = false;
        host.dataset.productSmoke = 'playing';
      }
      current.time = time;
      frame = productSmokeFrame(time, current.gatherPair);
      field.style.opacity = frame.veil;
      plume.style.opacity = frame.density;
      plume.style.setProperty('--smoke-pigment', `${frame.pigment * 100}%`);
      mark.style.opacity = frame.mark;
      host.style.setProperty('--product-smoke-copy', frame.copy);
      host.style.setProperty('--product-smoke-subject', frame.subject);
      host.toggleAttribute('data-product-smoke-covered', frame.copy < .45);
      invalidate();
    }
    request = requestAnimationFrame(update);
  }

  function play(profile, { reverse = false, gatherPair = false, done } = {}) {
    if (!profile || !prepare()) return false;
    stop(false);
    const [leading, middle, trailing] = profile.gradient || [profile.shade, profile.shade, profile.shade];
    field.style.setProperty('--smoke-leading', leading);
    field.style.setProperty('--smoke-middle', middle);
    field.style.setProperty('--smoke-trailing', trailing);
    field.toggleAttribute('data-reverse', reverse);
    if (video.currentTime > 0) video.currentTime = 0;
    const started = performance.now();
    const job = { started, lastFrame: started, lastMediaFrame: started, lastMediaTime: 0,
      time: 0, gatherPair, done };
    current = job;
    video.play().catch(() => {
      if (current === job) stop(true);
    });
    request = requestAnimationFrame(update);
    return true;
  }

  scope.on(document, 'visibilitychange', () => {
    if (document.hidden) stop(true);
  });
  scope.cleanup(() => {
    stop(false);
    if (!video) return;
    video.removeAttribute('src');
    video.load();
    field.remove();
    mark.remove();
  });
  return {
    prepare, play,
    finish: () => stop(true),
    cancel: () => stop(false),
    get busy() { return Boolean(current); },
    get frame() { return frame; }
  };
}
