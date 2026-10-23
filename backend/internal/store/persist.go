package store

import (
	"os"
	"path/filepath"
)

const tempSuffix = ".tmp"

// Even a no-op change waits until the state it saw is on disk: a repeated Subscribe
// must not answer ok before the first one is written.
func (s *Store) mutate(change func() bool) error {
	return s.flush(s.apply(change))
}

func (s *Store) apply(change func() bool) uint64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	if change() {
		s.version++
	}
	return s.version
}

func (s *Store) Flush() error {
	return s.mutate(func() bool { return false })
}

func (s *Store) flush(version uint64) error {
	s.flushMu.Lock()
	defer s.flushMu.Unlock()
	if s.flushed >= version {
		return nil
	}
	current, data, err := s.snapshot()
	if err != nil {
		return err
	}
	if err := s.write(s.path, data); err != nil {
		return err
	}
	s.flushed = current
	return nil
}

func (s *Store) snapshot() (uint64, []byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, err := encode(&s.state)
	return s.version, data, err
}

func writeFile(path string, data []byte) (err error) {
	temp := path + tempSuffix
	f, err := os.OpenFile(temp, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o600)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			os.Remove(temp)
		}
	}()
	_, err = f.Write(data)
	if err == nil {
		err = f.Sync()
	}
	if closeErr := f.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		return err
	}
	if err = os.Rename(temp, path); err != nil {
		return err
	}
	return syncDir(filepath.Dir(path))
}

func syncDir(dir string) error {
	d, err := os.Open(dir)
	if err != nil {
		return err
	}
	defer d.Close()
	return d.Sync()
}

func checkWritable(dir string) error {
	probe, err := os.CreateTemp(dir, ".writable-*")
	if err != nil {
		return err
	}
	probe.Close()
	return os.Remove(probe.Name())
}
