import sys

if __name__ == '__main__':
	lang = sys.argv[1] if len(sys.argv) > 1 else 'german'
	males = "{}-m.txt".format(lang)
	females = "{}-f.txt".format(lang)
	surnames = "{}-s.txt".format(lang)
	m_names = open(males, 'r').readlines()
	f_names = open(females, 'r').readlines()
	s_names = open(surnames, 'r').readlines()
	longest = max(len(m_names),len(f_names),len(s_names))

	print("export const {}Names = [".format(lang.capitalize()))
	for i in range(longest):
		male = m_names[i % len(m_names)].strip()
		female = f_names[i % len(f_names)].strip()
		surname = s_names[i % len(s_names)].strip()
		entry = {"forename":{"male":male, "female":female}, "surname": {"native": surname, "helveczian": surname}}
		print(entry,',')
	print("];")
