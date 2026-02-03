import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.datasets import CIFAR10
from torch.utils.data import random_split, DataLoader, Subset
import torchvision.transforms as transforms

from collections import deque
import numpy as np

train_dataset = CIFAR10(root='./data_CIFAR', train=True, download=True, transform=transforms.ToTensor())
dev_dataset = CIFAR10(root='./data_CIFAR', train=False, download=True, transform=transforms.ToTensor())

total_train_size = len(train_dataset)
total_dev_size = len(dev_dataset)
classes = 10

# Compute normalization stats
print(train_dataset.data.shape)
means = train_dataset.data.mean(axis=(0,1,2))/255
print('Means: ',means)
stds = train_dataset.data.std(axis=(0,1,2))/255
print('stds: ',stds)

# Data transforms (normalization & data augmentation)
stats = means, stds
train_tf = transforms.Compose([transforms.RandomCrop(32, padding=4, padding_mode='reflect'),
                         transforms.RandomHorizontalFlip(),
                         # tt.RandomRotate
                         # tt.RandomResizedCrop(256, scale=(0.5,0.9), ratio=(1, 1)),
                         # tt.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.1),
                         transforms.Normalize(*stats,inplace=True)])
valid_tf = transforms.Compose([transforms.Normalize(*stats)])

train_dataset.transform = transforms.Compose([train_dataset.transform, train_tf])
dev_dataset.transform = transforms.Compose([dev_dataset.transform, valid_tf])

def denormalize(images, means, stds):
    means = torch.tensor(means).reshape(1, 3, 1, 1)
    stds = torch.tensor(stds).reshape(1, 3, 1, 1)
    return images * stds + means

def show_batch(dl):
    for images, labels in dl:
        fig, ax = plt.subplots(figsize=(10, 10))
        ax.set_xticks([]); ax.set_yticks([])
        denorm_images = denormalize(images, *stats)
        ax.imshow(make_grid(denorm_images[:64], nrow=8).permute(1, 2, 0).clamp(0,1))
        break

def get_device():
    return torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

def to_device(data, device):
    if isinstance(data, (list, tuple)):
        return [to_device(x, device) for x in data]
    return data.to(device, non_blocking=True)

class DeviceDataLoader(DataLoader):
        def __init__(self, dl, device):
            self.dl = dl
            self.device = device

        def __iter__(self):
            for batch in self.dl:
                yield to_device(batch, self.device)

        def __len__(self):
            return len(self.dl)

device = get_device()
dev_loader = DeviceDataLoader(DataLoader(dev_dataset, 128), device)

num_clients = 20
mu_vector = np.array([np.exp(i/100) for i in range(num_clients)])
# mu_vector = 1/np.array([np.sqrt(i+1) for i in range(num_clients)])
tasks_per_client = 5
num_tasks = num_clients*tasks_per_client
num_tasks_1 = num_tasks - 1
initial_state = np.array(num_clients*[tasks_per_client])
routing_uniform = np.array([1/num_clients for k in range(num_clients)])
L, sigma, G = 1,3,10
B = 2*G**2 + sigma**2
A = 3

eta = 0.01
num_rounds = 30000
beta = 0.5

# for exp
opt_params = np.array([ 1.83814815, -0.70450148, -0.70761703, -0.71072237, -0.71381756,
       -0.71690266, -0.71997773, -0.72304282, -0.72609799, -0.72914329,
       -0.73217878, -0.73520449, -0.73822048, -0.74122679, -0.74422347,
       -0.74721056, -0.7501881 , -0.75315613, -0.75611469, -0.75906382])

routing_opt = np.exp(opt_params)/np.sum(np.exp(opt_params))
routing_mu = mu_vector/np.sum(mu_vector)




class JacksonNetwork:

    def __init__(self, num_stations, num_jobs, initial_state, mu_vector, routing):
        self.num_stations = num_stations
        self.num_jobs = num_jobs
        self.mu_vector = mu_vector
        self.routing = routing

        self.current_time = 0.0
        self.current_state = initial_state.copy()
        self.arrival_station = None
        self.departure_station = None
        self.rate_current_state = None

    def update(self):
        # Update time by using the transition times exponentially distributed
        mu_indicatrice = np.multiply(self.mu_vector, self.current_state > 0)
        self.rate_current_state = mu_indicatrice.sum()
        time_to_transition = np.random.exponential(scale=1 / self.rate_current_state)
        self.current_time += time_to_transition

        # Update state by using the embedded HMC
        departure_candidates = mu_indicatrice / self.rate_current_state
        self.departure_station = np.random.choice(self.num_stations, p=departure_candidates)
        self.arrival_station = np.random.choice(self.num_stations, p=self.routing)

        self.current_state[self.departure_station] -= 1
        self.current_state[self.arrival_station] += 1

# Simulate a jackson network
def simulate_network(num_clients, num_tasks, initial_state, mu_vector, routing, num_rounds, cv_round=int(1e6)):
  network = JacksonNetwork(num_clients, num_tasks, initial_state,mu_vector, routing)
  departure_servers, arrival_servers, transition_times = np.array([], dtype=int), np.array([], dtype=int), np.array([])
  for t in range(cv_round):
    network.update()
  init_state = network.current_state.copy()
  init_time = network.current_time
  for t in range(num_rounds):
    network.update()
    departure_servers = np.append(departure_servers, network.departure_station)
    arrival_servers = np.append(arrival_servers, network.arrival_station)
    transition_times = np.append(transition_times, network.current_time)
  return departure_servers, arrival_servers,init_state, transition_times-init_time




class ModelFederatedAsyncBase(nn.Module):
    
    def get_parameters(self):
        return [param.clone().detach() for param in self.parameters()]

    def apply_parameters(self, params):
        with torch.no_grad():
            for target_param, source_param in zip(self.parameters(), params):
                target_param.data.copy_(source_param)

    def update_parameters(self, gradients, lr):
        with torch.no_grad():
            for param, grad in zip(self.parameters(), gradients):
                param -= lr * grad

    def get_gradient(self, dataset, batch_size, criterion=F.cross_entropy, max_norm=10.0):
            data_loader = DeviceDataLoader(DataLoader(dataset, batch_size,shuffle=True), device)
            batch = next(iter(data_loader))
            data, target = batch
            output = self(data)
            self.zero_grad()
            loss = criterion(output, target)
            loss.backward()
            nn.utils.clip_grad_norm_(self.parameters(), max_norm)
            gradients = [param.grad for param in self.parameters()]
            return gradients

    def training_step(self, batch):
        images, labels = batch
        out = self(images)                 
        loss = F.cross_entropy(out, labels) 
        return loss

    def batch_accuracy(self, outputs, labels):
        with torch.no_grad():
            _, predictions = torch.max(outputs, dim=1)
            return torch.tensor(torch.sum(predictions == labels).item() / len(predictions))

    def _process_batch(self, batch,criterion=nn.CrossEntropyLoss()):
        with torch.no_grad():
            images, labels = batch
            outputs = self(images)
            loss = criterion(outputs, labels)
            accuracy = self.batch_accuracy(outputs, labels)
            return (loss, accuracy)

    def evaluate(self, test_loader):
        losses = []
        accs = []
        with torch.no_grad():
            for batch in test_loader:
                loss, acc = self._process_batch(batch)
                losses.append(loss)
                accs.append(acc)
        avg_loss = torch.stack(losses).mean().item()
        avg_acc = torch.stack(accs).mean().item()
        return (avg_loss, avg_acc)

def conv_block(in_channels, out_channels, pool=False, drop=False):
    num_groups = 32
    layers = [nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
              nn.ReLU(inplace=True),
              nn.GroupNorm(num_groups, out_channels),
              nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
              nn.ReLU(inplace=True),
              nn.GroupNorm(num_groups, out_channels),
             ]
    if pool: layers.append(nn.MaxPool2d(2))
    if drop: layers.append(nn.Dropout2d(0.25))
    return nn.Sequential(*layers)



class FederatedNet(ModelFederatedAsyncBase):
    def __init__(self):
        super().__init__()
        self.conv1 = conv_block(3, 32, pool=True, drop=True)
        self.conv2 = conv_block(32, 64, pool=True, drop=True)
        self.conv3 = conv_block(64, 128, pool=True, drop=True)

        self.classifier = nn.Sequential(nn.Flatten(),
                                        nn.Linear(128 * 4 * 4, 128),
                                        nn.Dropout(0.25),
                                        nn.Linear(128, classes))

    def forward(self, xb):
        out = self.conv1(xb)
        out = self.conv2(out)
        out = self.conv3(out)
        out = self.classifier(out)
        return out




class Client:
    def __init__(self, client_id, dataset, initial_params):
        self.client_id = client_id
        self.dataset = dataset
        self.params_queue = deque(initial_params)

    def get_dataset_size(self):
        return len(self.dataset)

    def get_client_id(self):
        return self.client_id

    def get_task(self):
        if len(self.params_queue) :
            return self.params_queue.popleft()
        else:
            return None

    def add_task(self,params):
        self.params_queue.append(params)

    def train(self, new_parameters, batch_size=1024):
        net = to_device(FederatedNet(), device)
        net.apply_parameters(new_parameters)
        gradient = net.get_gradient(self.dataset, batch_size)
        return gradient





def iid_split():
    examples_per_client = total_train_size // num_clients
    homogenous_client_datasets = random_split(train_dataset, [min(i + examples_per_client,
               total_train_size) - i for i in range(0, total_train_size, examples_per_client)])
    return homogenous_client_datasets

train_datasets_per_label = [Subset(train_dataset, []) for _ in range(classes)]
for idx, (img, label) in enumerate(train_dataset):
    train_datasets_per_label[label].indices.append(idx)

# Create non iid datasets for clients, each has '#classesPerClient' out of 10 classes
def split_dataset(classesPerClient):
    examples_per_client = total_train_size // num_clients
    examples_per_clientClass = examples_per_client // classesPerClient
    start_class = 0
    
    client_datasets_indices = [[] for _ in range(num_clients)]
    labels_indices = [list(train_datasets_per_label[idx].indices.copy()) for idx in range(classes)]
    for cl in range(num_clients):
    
      for l in [(start_class+i) % classes for i in range(classesPerClient)]:
        if len(labels_indices[l])>examples_per_clientClass:
          client_datasets_indices[cl] += labels_indices[l][:examples_per_clientClass]
          labels_indices[l] = labels_indices[l][examples_per_clientClass:]
        else :
          client_datasets_indices[cl] += labels_indices[l]
          labels_indices[l] = []
    
      start_class = (start_class+classesPerClient) % classes
    
    non_iid_client_datasets = [Subset(train_dataset, client_datasets_indices[cl]) for cl in range(num_clients)]
    return non_iid_client_datasets

# Splits the dataset among clients using the Dirichlet distribution to simulate non-IID data.
def split_dataset_dirichlet(train_dataset, num_clients, num_classes, beta):
    """  
    Args:
        train_dataset (Dataset): The complete dataset.
        num_clients (int): Number of clients.
        num_classes (int): Number of classes in the dataset.
        beta (float): Concentration parameter for the Dirichlet distribution.

    Returns:
        List[Subset]: A list of Subsets, each representing a client's dataset.
    """
    # Create a list to hold indices of each class's samples
    train_datasets_per_label = [Subset(train_dataset, []) for _ in range(num_classes)]
    
    # Populate the class-wise indices list
    for idx, (img, label) in enumerate(train_dataset):
        train_datasets_per_label[label].indices.append(idx)
    
    # Initialize a list to hold the dataset indices for each client
    client_datasets_indices = [[] for _ in range(num_clients)]
    
    # Allocate data for each class
    for k in range(num_classes):
        # Sample the proportions for this class across clients
        proportions = np.random.dirichlet([beta] * num_clients)
        
        # Shuffle indices for randomness before splitting
        np.random.shuffle(train_datasets_per_label[k].indices)
        
        # Calculate and allocate samples to each client
        total_samples = len(train_datasets_per_label[k].indices)
        client_sample_counts = (proportions * total_samples).astype(int)
        
        current_idx = 0
        for cl in range(num_clients):
            sample_count = client_sample_counts[cl]
            client_datasets_indices[cl].extend(
                train_datasets_per_label[k].indices[current_idx:current_idx + sample_count]
            )
            current_idx += sample_count
    
    # Create Subset objects for each client's dataset
    non_iid_client_datasets = [Subset(train_dataset, client_datasets_indices[cl]) for cl in range(num_clients)]
    
    return non_iid_client_datasets





def train_CS_Model(CS_net,departure_servers,arrival_servers,clients,routing,eta,dev_loader,num_rounds,dev_round=5,verb_round=50,verbos=True):
  history = []
  for t in range(num_rounds):
      finished_client = departure_servers[t]
      selected_client = arrival_servers[t]

      parametersInQueue = clients[finished_client].get_task()

      client_gradient = clients[finished_client].train(parametersInQueue, batch_size=512)
      CS_net.update_parameters(client_gradient, eta/(num_clients*routing[finished_client]))

      clients[selected_client].add_task(CS_net.get_parameters())

      if (t+1) % dev_round == 0:
        CS_net.eval()
        dev_loss, dev_acc = CS_net.evaluate(dev_loader)
        CS_net.train()
        history.append((dev_acc, dev_loss))

      if verbos and (t+1) % verb_round == 0:
        print('After round {}, dev_loss = {}, dev_acc = {}\n'.format(t + 1, round(dev_loss, 4), round(dev_acc, 4)))
  return history




def train_without_delay(CS_net,clients,routing,eta,dev_loader,num_rounds,dev_round=5,verb_round=50,verbos=True):
  history = []
  for t in range(num_rounds):
      
      selected_client = np.random.choice(num_clients, p=routing)
      parametersIn = CS_net.get_parameters()
      client_gradient = clients[selected_client].train(parametersIn, batch_size=512)
      CS_net.update_parameters(client_gradient, eta/(num_clients*routing[selected_client]))

      if (t+1) % dev_round == 0:
        CS_net.eval()
        dev_loss, dev_acc = CS_net.evaluate(dev_loader)
        CS_net.train()
        history.append((dev_acc, dev_loss))

      if verbos and (t+1) % verb_round == 0:
        print('After round {}, dev_loss = {}, dev_acc = {}\n'.format(t + 1, round(dev_loss, 4), round(dev_acc, 4)))
  return history




num_simulations = 3
additional_params = {'dev_round':50, 'verb_round':200, 'verbos':True}

# non_iid_client_datasets = split_dataset(3)
dirichlet_non_iid_client_datasets = split_dataset_dirichlet(train_dataset, num_clients, classes, beta)
# homogenous_client_datasets = iid_split()

CS_net = to_device(FederatedNet(), device)
init_parameters = CS_net.get_parameters()





def federated_async_training_simulation(num_simulations, num_clients, num_tasks, client_datasets, initial_state, mu_vector,
                                        routing,eta_star, num_rounds,**kwargs):
  all_histories = []
  all_times = []
  for i in range(num_simulations):
      print(f'==> Start Simulation {i+1} ...')
      np.random.seed(np.random.randint(1,100))
      torch.manual_seed(np.random.randint(1,100))
      departure_servers, arrival_servers, init_state, trans_times = simulate_network(num_clients, num_tasks, initial_state, mu_vector,
                                                                                     routing, num_rounds, cv_round=0)
      all_times.append(trans_times)
      CS_net = to_device(FederatedNet(), device)
      CS_net.apply_parameters(init_parameters)
      net_clients = [Client(i, client_datasets[i], [init_parameters]*init_state[i]) for i in range(num_clients)]
      history = train_CS_Model(CS_net,departure_servers,arrival_servers,net_clients,routing,eta_star,dev_loader,num_rounds,**kwargs)
      all_histories.append(history)

  return np.array(all_histories),np.array(all_times)





def sequencial_undelayed_simulation(num_simulations, num_clients, num_tasks, client_datasets, initial_state, mu_vector,
                                        routing,eta_star, num_rounds,**kwargs):
  all_histories = []
  for i in range(num_simulations):
    print(f'==> Start Simulation {i+1} ...')
    net_clients = [Client(i, client_datasets[i], [init_parameters]*initial_state[i]) for i in range(num_clients)]
    CS_net = to_device(FederatedNet(), device)
    CS_net.apply_parameters(init_parameters)
    history = train_without_delay(CS_net,net_clients,routing,eta_star,dev_loader,num_rounds,**kwargs)
    all_histories.append(history)
      
  return np.array(all_histories)




# Non-IID Settings (Dirichelet)
# all_histories_uniform_heterogene,all_times_uniform_heterogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                     dirichlet_non_iid_client_datasets,
#                                                                      initial_state,mu_vector,routing_uniform,eta,num_rounds,**additional_params)
# np.save('sim_results/CIFAR100_uniform_heterogene_results_dir.npy', all_histories_uniform_heterogene)
# np.save('sim_results/CIFAR100_uniform_heterogene_times_dir.npy', all_times_uniform_heterogene)

# all_histories_optimal_heterogene,all_times_optimal_heterogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                     dirichlet_non_iid_client_datasets,
#                                                                      initial_state,mu_vector,routing_opt,eta,num_rounds,**additional_params)
# np.save('sim_results/CIFAR100_optimal_heterogene_results_dir.npy', all_histories_optimal_heterogene)
# np.save('sim_results/CIFAR100_optimal_heterogene_times_dir.npy', all_times_optimal_heterogene)

all_histories_mu_heterogene,all_times_mu_heterogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
                                                                                                    dirichlet_non_iid_client_datasets,
                                                                     initial_state,mu_vector,routing_mu,eta,num_rounds,**additional_params)
np.save('sim_results/CIFAR100_mu_heterogene_results_dir.npy', all_histories_mu_heterogene)
np.save('sim_results/CIFAR100_mu_heterogene_times_dir.npy', all_times_mu_heterogene)

# # IID Settings
# all_histories_uniform_homogene, all_times_uniform_homogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                  homogenous_client_datasets,initial_state,mu_vector,
#                                                                                                  routing_uniform,eta,num_rounds,
#                                                                                                  **additional_params)
# np.save('sim_results/CIFAR100_uniform_homogene_results.npy', all_histories_uniform_homogene)
# np.save('sim_results/CIFAR100_uniform_homogene_times.npy', all_times_uniform_homogene)

# all_histories_optimal_homogene,all_times_optimal_homogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                 homogenous_client_datasets,
#                                                                      initial_state,mu_vector,routing_opt,eta,num_rounds,**additional_params)
# np.save('sim_results/CIFAR100_optimal_homogene_results.npy', all_histories_optimal_homogene)
# np.save('sim_results/CIFAR100_optimal_homogene_times.npy', all_times_optimal_homogene)

# all_histories_mu_homogene,all_times_mu_homogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                 homogenous_client_datasets,
#                                                                      initial_state,mu_vector,routing_mu,eta,num_rounds,**additional_params)
# np.save('sim_results/CIFAR100_mu_homogene_results.npy', all_histories_mu_homogene)
# np.save('sim_results/CIFAR100_mu_homogene_times.npy', all_times_mu_homogene)

# # Non-IID Settings (3 classes per client)
# all_histories_uniform_heterogene,all_times_uniform_heterogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                     non_iid_client_datasets,
#                                                                      initial_state,mu_vector,routing_uniform,eta,num_rounds,**additional_params)
# np.save('sim_results/C10exp_uniform_heterogene_results_3.npy', all_histories_uniform_heterogene)
# np.save('sim_results/C10exp_uniform_heterogene_times_3.npy', all_times_uniform_heterogene)

# all_histories_optimal_heterogene,all_times_optimal_heterogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                     non_iid_client_datasets,
#                                                                      initial_state,mu_vector,routing_opt,eta,num_rounds,**additional_params)
# np.save('sim_results/C10exp_optimal_heterogene_results_3.npy', all_histories_optimal_heterogene)
# np.save('sim_results/C10exp_optimal_heterogene_times_3.npy', all_times_optimal_heterogene)

# all_histories_mu_heterogene,all_times_mu_heterogene = federated_async_training_simulation(num_simulations,num_clients,num_tasks,
#                                                                                                     non_iid_client_datasets,
#                                                                      initial_state,mu_vector,routing_mu,eta,num_rounds,**additional_params)
# np.save('sim_results/C10exp_mu_heterogene_results_3.npy', all_histories_mu_heterogene)
# np.save('sim_results/C10exp_mu_heterogene_times_3.npy', all_times_mu_heterogene)