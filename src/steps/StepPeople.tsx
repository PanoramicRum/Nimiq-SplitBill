import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { getAvatarGradient, getInitials } from '../utils/avatarColors';

export function StepPeople() {
  const navigate = useNavigate();
  const people = useBillStore((s) => s.people);
  const addPerson = useBillStore((s) => s.addPerson);
  const removePerson = useBillStore((s) => s.removePerson);
  const updatePerson = useBillStore((s) => s.updatePerson);
  const [inputName, setInputName] = useState('');

  const handleAdd = () => {
    const defaultName = people.length === 0 ? 'Organizer' : `Person ${people.length}`;
    const name = inputName.trim() || defaultName;
    addPerson(name);
    setInputName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const placeholder = people.length === 0 ? 'Organizer' : `Person ${people.length}`;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Split Bill" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Main Heading */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Who's splitting this?
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Add your friends to start dividing the expenses.
        </p>

        {/* Add person input */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Add person by nickname
          </label>
          <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-primary/20 bg-white shadow-sm dark:bg-slate-800/50">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-14 flex-1 border-none bg-transparent px-4 text-base text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white"
            />
            <button
              onClick={handleAdd}
              className="flex items-center justify-center bg-primary px-5 text-white transition-colors hover:bg-primary/90"
            >
              <Icon name="person_add" className="text-xl" />
            </button>
          </div>
        </div>

        {/* People list */}
        {people.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              People in the split
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {people.length}
              </span>
            </h3>
            <div className="space-y-3">
              {people.map((person, i) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between rounded-xl border border-primary/5 bg-white p-3 shadow-sm dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-lg font-bold text-white`}
                    >
                      {getInitials(person.name)}
                    </div>
                    <div>
                      {/* Name (editable) */}
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) =>
                          updatePerson(person.id, { name: e.target.value })
                        }
                        className="border-0 bg-transparent p-0 font-bold leading-none text-slate-900 focus:ring-0 dark:text-white"
                      />
                      {/* Organizer badge for first person */}
                      {i === 0 && (
                        <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                          You
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removePerson(person.id)}
                    className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Icon name="close" className="text-lg" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {people.length === 0 && (
          <div className="mt-8 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-12 dark:border-slate-700">
            <Icon
              name="group_add"
              className="mb-3 text-5xl text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Add at least 2 people to split
            </p>
          </div>
        )}
      </div>

      <BottomCTA
        label="Continue to Split"
        onClick={() => navigate('/split-method')}
        disabled={people.length < 2}
      />
    </div>
  );
}
